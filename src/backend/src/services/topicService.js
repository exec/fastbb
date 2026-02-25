/**
 * Topic API Routes
 * Handles topic listing, creation, and management
 */

const { getDatabase } = require('../config/database');
const cache = require('../middleware/cache');

/**
 * Sanitize HTML content to prevent XSS attacks
 * Removes dangerous tags and attributes
 * @param {string} content - HTML content to sanitize
 * @returns {string} - Sanitized content
 */
function sanitizeContent(content) {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Remove script tags and their content
  let sanitized = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Remove style tags and their content
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  // Remove object, embed, and applet tags
  sanitized = sanitized.replace(/<(?:object|embed|applet)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '');
  // Remove event handler attributes (case insensitive)
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*[^\s>]*/gi, '');
  // Remove javascript: and data: URLs (case insensitive)
  sanitized = sanitized.replace(/(?:href|src)\s*=\s*["']\s*javascript:/gi, 'href="javascript:void(0)"');
  sanitized = sanitized.replace(/(?:href|src)\s*=\s*["']\s*data:/gi, 'href="data:void(0)"');

  return sanitized;
}

/**
 * Get topics for a forum with pagination
 * @param {number} forumId - Forum ID
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {object} - Topics with pagination info
 */
async function getTopicsForForum(forumId, page = 1, limit = 20) {
  const db = getDatabase();
  const offset = (page - 1) * limit;

  // Get total count
  const totalCount = await new Promise((resolve, reject) => {
    db.get(
      'SELECT COUNT(*) as count FROM topics WHERE forum_id = ?',
      [forumId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      }
    );
  });

  const totalPages = Math.ceil(totalCount / limit);

  // Get topics
  const topics = await new Promise((resolve, reject) => {
    db.all(
      `SELECT t.id, t.title, t.created, t.views, t.closed, t.pinned,
              t.last_post_id,
              u.id as author_id, u.username as author_name,
              (SELECT COUNT(*) FROM posts WHERE topic_id = t.id AND is_deleted = 0) as reply_count,
              (SELECT p.created FROM posts p WHERE p.topic_id = t.id ORDER BY p.created DESC LIMIT 1) as last_post_date
       FROM topics t
       JOIN users u ON u.id = t.user_id
       WHERE t.forum_id = ?
       ORDER BY t.pinned DESC, t.last_post_id DESC
       LIMIT ? OFFSET ?`,
      [forumId, limit, offset],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });

  // Get authors for last posts
  const topicIds = topics.map(t => t.id);
  const lastPostAuthors = await new Promise((resolve, reject) => {
    if (topicIds.length === 0) return resolve([]);

    db.all(
      `SELECT p.topic_id, u.username as last_post_author, p.created as last_post_date
       FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.topic_id IN (${topicIds.join(',')})
       ORDER BY p.created DESC`,
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });

  // Map last post authors to topics
  const authorsMap = {};
  lastPostAuthors.forEach(ap => {
    if (!authorsMap[ap.topic_id]) {
      authorsMap[ap.topic_id] = ap;
    }
  });

  const result = topics.map(topic => ({
    ...topic,
    author: authorsMap[topic.id]?.last_post_author || topic.author_name,
    last_post_date: authorsMap[topic.id]?.last_post_date || topic.last_post_date,
    page: page
  }));

  return {
    topics: result,
    pagination: {
      current: page,
      total: totalPages,
      count: totalCount,
      limit
    }
  };
}

/**
 * Get topic by ID with posts
 * @param {number} topicId - Topic ID
 * @param {number} page - Page number
 * @param {number} limit - Posts per page
 * @returns {object|null} - Topic with posts or null
 */
async function getTopicById(topicId, page = 1, limit = 15) {
  const db = getDatabase();
  const offset = (page - 1) * limit;

  // Get topic
  const topic = await new Promise((resolve, reject) => {
    db.get(
      `SELECT t.id, t.title, t.forum_id, t.user_id, t.created, t.views, t.closed, t.pinned,
              u.username as author, u.id as author_id
       FROM topics t
       JOIN users u ON u.id = t.user_id
       WHERE t.id = ?`,
      [topicId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!topic) {
    return null;
  }

  // Increment view count
  await new Promise((resolve, reject) => {
    db.run('UPDATE topics SET views = views + 1 WHERE id = ?', [topicId], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // Get total post count
  const totalCount = await new Promise((resolve, reject) => {
    db.get(
      'SELECT COUNT(*) as count FROM posts WHERE topic_id = ? AND is_deleted = 0',
      [topicId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      }
    );
  });

  const totalPages = Math.ceil(totalCount / limit);

  // Get posts
  const posts = await new Promise((resolve, reject) => {
    db.all(
      `SELECT p.id, p.content, p.created, p.edited, p.is_edited, p.is_deleted, p.deleted_reason,
              u.id as user_id, u.username, u.joined, u.is_active,
              (SELECT COUNT(*) FROM posts WHERE user_id = u.id AND is_deleted = 0) as post_count
       FROM posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.topic_id = ? AND p.is_deleted = 0
       ORDER BY p.created ASC
       LIMIT ? OFFSET ?`,
      [topicId, limit, offset],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });

  // Get previous topic
  const prevTopic = await new Promise((resolve, reject) => {
    db.get(
      'SELECT id, title FROM topics WHERE forum_id = ? AND id < ? AND is_deleted = 0 ORDER BY id DESC LIMIT 1',
      [topic.forum_id, topicId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  // Get next topic
  const nextTopic = await new Promise((resolve, reject) => {
    db.get(
      'SELECT id, title FROM topics WHERE forum_id = ? AND id > ? AND is_deleted = 0 ORDER BY id ASC LIMIT 1',
      [topic.forum_id, topicId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  cache.delete(`forum:${topic.forum_id}:topics`);

  return {
    topic: {
      ...topic,
      page,
      prev_topic: prevTopic,
      next_topic: nextTopic
    },
    posts,
    pagination: {
      current: page,
      total: totalPages,
      count: totalCount,
      limit
    }
  };
}

/**
 * Create a new topic
 * @param {object} data - Topic data
 * @returns {object} - Created topic
 */
async function createTopic(data) {
  const db = getDatabase();
  const { forumId, userId, title, content } = data;

  if (!title || !content) {
    throw new Error('Title and content are required');
  }

  if (title.length < 3 || title.length > 100) {
    throw new Error('Title must be between 3 and 100 characters');
  }

  const topicId = await new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO topics (forum_id, user_id, title) VALUES (?, ?, ?)',
      [forumId, userId, title],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });

  const postId = await new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO posts (topic_id, user_id, content) VALUES (?, ?, ?)',
      [topicId, userId, sanitizeContent(content)],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });

  // Update topic with first post ID
  await new Promise((resolve, reject) => {
    db.run('UPDATE topics SET last_post_id = ? WHERE id = ?', [postId, topicId], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // Clear caches
  cache.delete(`forum:${forumId}:topics`);
  cache.delete('forums:all');

  return {
    topicId,
    postId,
    message: 'Topic created successfully'
  };
}

/**
 * Create a new post
 * @param {object} data - Post data
 * @returns {object} - Created post
 */
async function createPost(data) {
  const db = getDatabase();
  const { topicId, userId, content } = data;

  if (!content) {
    throw new Error('Content is required');
  }

  const postId = await new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO posts (topic_id, user_id, content) VALUES (?, ?, ?)',
      [topicId, userId, sanitizeContent(content)],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });

  // Update topic's last_post_id
  await new Promise((resolve, reject) => {
    db.run('UPDATE topics SET last_post_id = ? WHERE id = ?', [postId, topicId], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // Clear caches
  const topic = await new Promise((resolve, reject) => {
    db.get('SELECT forum_id FROM topics WHERE id = ?', [topicId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  cache.delete(`forum:${topic.forum_id}:topics`);
  cache.delete('forums:all');

  return {
    postId,
    topicId,
    message: 'Post created successfully'
  };
}

module.exports = {
  getTopicsForForum,
  getTopicById,
  createTopic,
  createPost
};
