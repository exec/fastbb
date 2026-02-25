/**
 * Forums Routes
 */

const express = require('express');
const router = express.Router();
const cache = require('../middleware/cache');
const { authenticate } = require('../middleware/auth');

/**
 * Helper function to get database
 */
function getDb() {
  return require('../config/database').getDatabase();
}

/**
 * Sanitize forum name/description to prevent XSS
 * @param {string} input - Raw input
 * @returns {string} - Sanitized input
 */
function sanitizeForumInput(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }
  // Remove HTML tags
  return input.replace(/<[^>]*>/g, '').trim();
}

// Get all forums with statistics
router.get('/', async (req, res) => {
  try {
    const cacheKey = 'forums:all';
    const cached = cache.get(cacheKey);

    if (cached) {
      return res.status(200).json({
        success: true,
        forums: cached
      });
    }

    const db = getDb();

    // Get all forums with parent info
    const forums = await new Promise((resolve, reject) => {
      db.all(`
        SELECT f.*,
               (SELECT COUNT(*) FROM topics WHERE topics.forum_id = f.id) as thread_count,
               (SELECT COUNT(*) FROM posts p WHERE p.topic_id IN (SELECT id FROM topics WHERE forum_id = f.id) AND p.is_deleted = 0) as post_count
        FROM forums f
        WHERE f.is_active = 1
        ORDER BY f.sort_order, f.name
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Get latest posts for each forum
    const forumsWithStats = await Promise.all(forums.map(async (forum) => {
      const latestPost = await new Promise((resolve, reject) => {
        db.get(`
          SELECT p.id, p.topic_id, p.created, p.is_deleted,
                 t.title as topic_title,
                 u.username as author_name
          FROM posts p
          JOIN topics t ON p.topic_id = t.id
          JOIN users u ON p.user_id = u.id
          WHERE t.forum_id = ?
          AND p.is_deleted = 0
          ORDER BY p.created DESC
          LIMIT 1
        `, [forum.id], (err, row) => {
          if (err) reject(err);
          else resolve(row || null);
        });
      });

      return {
        ...forum,
        latest_post: latestPost ? {
          id: latestPost.id,
          title: latestPost.topic_title,
          author: latestPost.author_name,
          date: latestPost.created,
          url: `/topic/${latestPost.topic_id}/post/${latestPost.id}`
        } : null
      };
    }));

    cache.set(cacheKey, forumsWithStats);
    res.status(200).json({
      success: true,
      forums: forumsWithStats
    });
  } catch (err) {
    console.error('Error fetching forums:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch forums'
    });
  }
});

// Get single forum details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const db = getDb();

    // Get forum
    const forum = await new Promise((resolve, reject) => {
      db.get(`
        SELECT f.*,
               (SELECT COUNT(*) FROM topics WHERE topics.forum_id = f.id) as thread_count,
               (SELECT COUNT(*) FROM posts p WHERE p.topic_id IN (SELECT id FROM topics WHERE forum_id = f.id) AND p.is_deleted = 0) as post_count
        FROM forums f
        WHERE f.id = ?
      `, [id], (err, row) => {
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

    // Get sub-forums
    const subForums = await new Promise((resolve, reject) => {
      db.all(`
        SELECT f.*,
               (SELECT COUNT(*) FROM topics WHERE topics.forum_id = f.id) as thread_count,
               (SELECT COUNT(*) FROM posts p WHERE p.topic_id IN (SELECT id FROM topics WHERE forum_id = f.id) AND p.is_deleted = 0) as post_count
        FROM forums f
        WHERE f.parent_id = ?
        AND f.is_active = 1
        ORDER BY f.sort_order
      `, [id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Get latest post
    const latestPost = await new Promise((resolve, reject) => {
      db.get(`
        SELECT p.id, p.topic_id, p.created, p.is_deleted,
               t.title as topic_title,
               u.username as author_name
        FROM posts p
        JOIN topics t ON p.topic_id = t.id
        JOIN users u ON p.user_id = u.id
        WHERE t.forum_id = ?
        AND p.is_deleted = 0
        ORDER BY p.created DESC
        LIMIT 1
      `, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });

    res.status(200).json({
      success: true,
      forum: {
        ...forum,
        sub_forums: subForums,
        latest_post: latestPost
      }
    });
  } catch (err) {
    console.error('Error fetching forum:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch forum'
    });
  }
});

// Create new forum
router.post('/', authenticate(), async (req, res) => {
  try {
    const { name, description, parent_id, sort_order } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Forum name is required'
      });
    }

    const db = getDb();

    // Sanitize inputs
    const sanitizedName = sanitizeForumInput(name);
    const sanitizedDescription = sanitizeForumInput(description);

    const forumId = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO forums (name, description, parent_id, sort_order)
        VALUES (?, ?, ?, ?)
      `, [sanitizedName, sanitizedDescription, parent_id || null, sort_order || 0], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });

    // Clear cache
    cache.delete('forums:all');

    res.status(201).json({
      success: true,
      id: forumId,
      message: 'Forum created successfully'
    });
  } catch (err) {
    console.error('Error creating forum:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to create forum'
    });
  }
});

// Update forum
router.put('/:id', authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parent_id, sort_order, is_active } = req.body;

    const db = getDb();

    // Check if forum exists
    const exists = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM forums WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!exists) {
      return res.status(404).json({
        success: false,
        error: 'Forum not found'
      });
    }

    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE forums
        SET name = ?, description = ?, parent_id = ?, sort_order = ?, is_active = ?
        WHERE id = ?
      `, [
        sanitizeForumInput(name),
        sanitizeForumInput(description),
        parent_id, sort_order, is_active, id
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Clear cache
    cache.delete('forums:all');
    cache.delete(`forum:${id}`);

    res.status(200).json({
      success: true,
      message: 'Forum updated successfully'
    });
  } catch (err) {
    console.error('Error updating forum:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update forum'
    });
  }
});

// Delete forum
router.delete('/:id', authenticate(), async (req, res) => {
  try {
    const { id } = req.params;

    const db = getDb();

    // Check if forum exists
    const exists = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM forums WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!exists) {
      return res.status(404).json({
        success: false,
        error: 'Forum not found'
      });
    }

    // Check if forum has sub-forums
    const hasSubForums = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM forums WHERE parent_id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row.count > 0);
      });
    });

    if (hasSubForums) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete forum with sub-forums. Move sub-forums first.'
      });
    }

    await new Promise((resolve, reject) => {
      db.run('DELETE FROM forums WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Clear cache
    cache.delete('forums:all');

    res.status(200).json({
      success: true,
      message: 'Forum deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting forum:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to delete forum'
    });
  }
});

// Mark forum as read
router.post('/:id/mark-read', authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const db = getDb();

    // Update user's last visit time for this forum
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO forum_reads (user_id, forum_id, read_time)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `, [userId, id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.status(200).json({
      success: true,
      message: 'Forum marked as read'
    });
  } catch (err) {
    console.error('Error marking forum as read:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to mark forum as read'
    });
  }
});

module.exports = router;
