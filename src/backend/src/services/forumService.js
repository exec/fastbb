/**
 * Forum API Routes
 * Handles forum listing, creation, and management
 */

const { getDatabase } = require('../config/database');
const cache = require('../middleware/cache');

/**
 * Get all forums with statistics
 */
async function getAllForums() {
  const cacheKey = 'forums:all';
  const cached = cache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const db = getDatabase();

  // Get all forums ordered by sort_order
  const forums = await new Promise((resolve, reject) => {
    db.all(
      `SELECT f.id, f.name, f.description, f.parent_id, f.sort_order, f.is_active,
              COUNT(DISTINCT t.id) as thread_count,
              COUNT(DISTINCT p.id) as post_count,
              MAX(p.created) as last_post_date,
              lu.username as last_post_author,
              lt.title as last_post_title
       FROM forums f
       LEFT JOIN topics t ON t.forum_id = f.id
       LEFT JOIN posts p ON p.topic_id = t.id AND p.is_deleted = 0
       LEFT JOIN users lu ON lu.id = p.user_id
       LEFT JOIN topics lt ON lt.id = t.id
       WHERE f.is_active = 1
       GROUP BY f.id
       ORDER BY f.sort_order, f.parent_id`,
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });

  // Group forums into categories and sub-forums
  const forumsMap = {};
  const categories = [];

  forums.forEach(forum => {
    forumsMap[forum.id] = { ...forum, sub_forums: [] };

    if (forum.parent_id === null) {
      categories.push(forum);
    }
  });

  // Attach sub-forums to their parents
  forums.forEach(forum => {
    if (forum.parent_id !== null && forumsMap[forum.parent_id]) {
      forumsMap[forum.parent_id].sub_forums.push(forum);
    }
  });

  const result = categories.map(cat => forumsMap[cat.id]);

  // Cache for 5 minutes
  cache.set(cacheKey, result, 300000);

  return result;
}

/**
 * Get forum by ID with details
 * @param {number} forumId - Forum ID
 * @returns {object|null} - Forum details or null
 */
async function getForumById(forumId) {
  const db = getDatabase();

  const forum = await new Promise((resolve, reject) => {
    db.get(
      `SELECT f.id, f.name, f.description, f.parent_id, f.is_active,
              COUNT(DISTINCT t.id) as thread_count,
              COUNT(DISTINCT p.id) as post_count
       FROM forums f
       LEFT JOIN topics t ON t.forum_id = f.id
       LEFT JOIN posts p ON p.topic_id = t.id AND p.is_deleted = 0
       WHERE f.id = ? AND f.is_active = 1
       GROUP BY f.id`,
      [forumId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!forum) {
    return null;
  }

  // Get parent forum if exists
  if (forum.parent_id) {
    const parent = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, name, description FROM forums WHERE id = ?',
        [forum.parent_id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    forum.parent = parent;
  }

  // Get sub-forums
  const subForums = await new Promise((resolve, reject) => {
    db.all(
      'SELECT id, name, description, thread_count, post_count FROM forums WHERE parent_id = ? AND is_active = 1',
      [forumId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
  forum.sub_forums = subForums;

  // Get latest posts
  const latestPosts = await new Promise((resolve, reject) => {
    db.all(
      `SELECT p.id, p.content, p.created, u.username, t.id as topic_id, t.title as topic_title
       FROM posts p
       JOIN users u ON u.id = p.user_id
       JOIN topics t ON t.id = p.topic_id
       WHERE p.topic_id IN (SELECT id FROM topics WHERE forum_id = ?)
       AND p.is_deleted = 0
       ORDER BY p.created DESC
       LIMIT 5`,
      [forumId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
  forum.latest_posts = latestPosts;

  // Clear cache
  cache.delete('forums:all');

  return forum;
}

module.exports = {
  getAllForums,
  getForumById
};
