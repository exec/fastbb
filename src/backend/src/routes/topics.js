/**
 * Topics Routes
 */

const express = require('express');
const router = express.Router();
const cache = require('../middleware/cache');
const { authenticate } = require('../middleware/auth');
const { getDatabase } = require('../config/database');

// Whitelist for ORDER BY columns to prevent SQL injection
const VALID_SORT_COLUMNS = {
  subject: 't.title',
  starter: 'u.username',
  rating: 't.rating',
  lastpost: 't.last_post_id'
};
const VALID_SORT_ORDERS = ['ASC', 'DESC'];

function getOrderByClause(sort, order = 'DESC') {
  const column = VALID_SORT_COLUMNS[sort] || VALID_SORT_COLUMNS['lastpost'];
  const sortOrder = VALID_SORT_ORDERS.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';
  return `${column} ${sortOrder}`;
}

// Get all topics in a forum
router.get('/', async (req, res) => {
  try {
    const { forum_id, page = 1, limit = 20, sort = 'lastpost', order = 'DESC' } = req.query;
    const offset = (page - 1) * limit;

    // Validate sort parameter and build ORDER BY clause
    const orderBy = getOrderByClause(sort, order);

    const topics = await new Promise((resolve, reject) => {
      db.all(`
        SELECT t.*,
               u.username as author_name,
               (SELECT COUNT(*) FROM posts WHERE topic_id = t.id AND is_deleted = 0) as reply_count
        FROM topics t
        JOIN users u ON t.user_id = u.id
        WHERE t.forum_id = ?
        ORDER BY t.pinned DESC, ${orderBy}
        LIMIT ? OFFSET ?
      `, [forum_id, parseInt(limit), offset], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Get total count
    const totalCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM topics WHERE forum_id = ?', [forum_id], (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success: true,
      topics,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages
      }
    });
  } catch (err) {
    console.error('Error fetching topics:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch topics'
    });
  }
});

// Get single topic with posts
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const db = getDatabase();

    // Get topic
    const topic = await new Promise((resolve, reject) => {
      db.get(`
        SELECT t.*,
               u.username as author_name,
               (SELECT COUNT(*) FROM posts WHERE topic_id = t.id AND is_deleted = 0) as reply_count
        FROM topics t
        JOIN users u ON t.user_id = u.id
        WHERE t.id = ?
      `, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!topic) {
      return res.status(404).json({
        success: false,
        error: 'Topic not found'
      });
    }

    // Increment view count
    db.run('UPDATE topics SET views = views + 1 WHERE id = ?', [id]);

    // Get posts for this topic
    const posts = await new Promise((resolve, reject) => {
      db.all(`
        SELECT p.*,
               u.username,
               u.email,
               u.joined,
               u.is_active,
               (SELECT COUNT(*) FROM posts WHERE user_id = p.user_id AND is_deleted = 0) as post_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.topic_id = ?
        AND p.is_deleted = 0
        ORDER BY p.created ASC
        LIMIT ? OFFSET ?
      `, [id, parseInt(limit), offset], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Get total post count
    const totalCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM posts WHERE topic_id = ? AND is_deleted = 0', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success: true,
      topic,
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages
      }
    });
  } catch (err) {
    console.error('Error fetching topic:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch topic'
    });
  }
});

// Create new topic
router.post('/', authenticate(), async (req, res) => {
  try {
    const { forum_id, title, content } = req.body;

    if (!forum_id || !title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Forum ID, title, and content are required'
      });
    }

    const db = getDatabase();

    // Check if forum exists
    const forum = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM forums WHERE id = ? AND is_active = 1', [forum_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!forum) {
      return res.status(404).json({
        success: false,
        error: 'Forum not found'
      });
    }

    // Create topic
    const topicId = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO topics (forum_id, user_id, title)
        VALUES (?, ?, ?)
      `, [forum_id, req.user.id, title], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });

    // Create first post
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO posts (topic_id, user_id, content)
        VALUES (?, ?, ?)
      `, [topicId, req.user.id, content], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Update forum topic count
    db.run('UPDATE forums SET thread_count = (SELECT COUNT(*) FROM topics WHERE forum_id = ?) WHERE id = ?', [forum_id, forum_id]);

    // Clear cache
    cache.delete('forums:all');
    cache.delete(`forum:${forum_id}:topics`);

    res.status(201).json({
      success: true,
      id: topicId,
      message: 'Topic created successfully'
    });
  } catch (err) {
    console.error('Error creating topic:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to create topic'
    });
  }
});

// Update topic
router.put('/:id', authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    const db = getDatabase();

    // Check if topic exists and belongs to user
    const topic = await new Promise((resolve, reject) => {
      db.get('SELECT id, user_id FROM topics WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!topic) {
      return res.status(404).json({
        success: false,
        error: 'Topic not found'
      });
    }

    // Check permissions (user must be author or admin)
    if (topic.user_id !== req.user.id && req.user.group_id !== 1) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this topic'
      });
    }

    if (title) {
      await new Promise((resolve, reject) => {
        db.run('UPDATE topics SET title = ? WHERE id = ?', [title, id], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    if (content) {
      await new Promise((resolve, reject) => {
        db.run(`
          UPDATE posts SET content = ?, edited = CURRENT_TIMESTAMP, is_edited = 1
          WHERE topic_id = ? AND user_id = ?
          LIMIT 1
        `, [content, id, req.user.id], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    // Clear cache
    cache.delete(`topic:${id}`);

    res.status(200).json({
      success: true,
      message: 'Topic updated successfully'
    });
  } catch (err) {
    console.error('Error updating topic:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update topic'
    });
  }
});

// Delete topic
router.delete('/:id', authenticate(), async (req, res) => {
  try {
    const { id } = req.params;

    const db = getDatabase();

    // Check if topic exists
    const topic = await new Promise((resolve, reject) => {
      db.get('SELECT id, forum_id, user_id FROM topics WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!topic) {
      return res.status(404).json({
        success: false,
        error: 'Topic not found'
      });
    }

    // Check permissions
    if (topic.user_id !== req.user.id && req.user.group_id !== 1) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this topic'
      });
    }

    // Delete topic (posts will be deleted via cascade)
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM topics WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Update forum statistics
    db.run('UPDATE forums SET thread_count = (SELECT COUNT(*) FROM topics WHERE forum_id = ?) WHERE id = ?', [topic.forum_id, topic.forum_id]);

    // Clear cache
    cache.delete('forums:all');
    cache.delete(`forum:${topic.forum_id}:topics`);
    cache.delete(`topic:${id}`);

    res.status(200).json({
      success: true,
      message: 'Topic deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting topic:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to delete topic'
    });
  }
});

// Lock topic
router.post('/:id/lock', authenticate(), async (req, res) => {
  try {
    const { id } = req.params;

    const db = getDatabase();

    await new Promise((resolve, reject) => {
      db.run('UPDATE topics SET closed = 1 WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    cache.delete(`topic:${id}`);

    res.status(200).json({
      success: true,
      message: 'Topic locked'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to lock topic'
    });
  }
});

// Unlock topic
router.post('/:id/unlock', authenticate(), async (req, res) => {
  try {
    const { id } = req.params;

    const db = getDatabase();

    await new Promise((resolve, reject) => {
      db.run('UPDATE topics SET closed = 0 WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    cache.delete(`topic:${id}`);

    res.status(200).json({
      success: true,
      message: 'Topic unlocked'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to unlock topic'
    });
  }
});

// Pin topic
router.post('/:id/pin', authenticate(), async (req, res) => {
  try {
    const { id } = req.params;

    const db = getDatabase();

    await new Promise((resolve, reject) => {
      db.run('UPDATE topics SET pinned = 1 WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    cache.delete(`topic:${id}`);

    res.status(200).json({
      success: true,
      message: 'Topic pinned'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to pin topic'
    });
  }
});

// Unpin topic
router.post('/:id/unpin', authenticate(), async (req, res) => {
  try {
    const { id } = req.params;

    const db = getDatabase();

    await new Promise((resolve, reject) => {
      db.run('UPDATE topics SET pinned = 0 WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    cache.delete(`topic:${id}`);

    res.status(200).json({
      success: true,
      message: 'Topic unpinned'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to unpin topic'
    });
  }
});

// Increment topic views
router.post('/:id/views', async (req, res) => {
  try {
    const { id } = req.params;

    const db = getDatabase();

    await new Promise((resolve, reject) => {
      db.run('UPDATE topics SET views = views + 1 WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.status(200).json({
      success: true,
      message: 'Views incremented'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to increment views'
    });
  }
});

module.exports = router;
