/**
 * Users Routes
 */

const express = require('express');
const router = express.Router();
const cache = require('../middleware/cache');
const { authenticate } = require('../middleware/auth');
const { getDatabase } = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - Raw input
 * @returns {string} - Sanitized input
 */
function sanitizeUserInput(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }
  // Remove HTML tags
  return input.replace(/<[^>]*>/g, '').trim();
}

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const db = getDatabase();

    const user = await new Promise((resolve, reject) => {
      db.get(`
        SELECT id, username, email, group_id, is_active, joined, last_visit,
               (SELECT COUNT(*) FROM topics WHERE topics.user_id = users.id) as topics_count,
               (SELECT COUNT(*) FROM posts WHERE posts.user_id = users.id AND posts.is_deleted = 0) as posts_count
        FROM users
        WHERE id = ?
      `, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user'
    });
  }
});

// Update user profile
router.put('/:id', authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const { email, timezone, theme } = req.body;

    const db = getDatabase();

    // Check if user exists
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id, username FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check permissions - users can only update their own profile unless admin
    if (req.user.id !== parseInt(id) && req.user.group_id !== 1) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this profile'
      });
    }

    const updates = [];
    const values = [];

    if (email) {
      updates.push('email = ?');
      values.push(sanitizeUserInput(email));
    }
    if (timezone) {
      updates.push('timezone = ?');
      values.push(sanitizeUserInput(timezone));
    }
    if (theme) {
      updates.push('theme = ?');
      values.push(sanitizeUserInput(theme));
    }

    if (updates.length > 0) {
      values.push(id);
      await new Promise((resolve, reject) => {
        db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    // Clear cache
    cache.delete(`user:${id}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    });
  }
});

// Delete user
router.delete('/:id', authenticate(), async (req, res) => {
  try {
    const { id } = req.params;

    const db = getDatabase();

    // Check permissions
    if (req.user.id !== parseInt(id) && req.user.group_id !== 1) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this user'
      });
    }

    // Soft delete user
    await new Promise((resolve, reject) => {
      db.run('UPDATE users SET is_active = 0 WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Clear cache
    cache.delete(`user:${id}`);

    res.status(200).json({
      success: true,
      message: 'User account disabled'
    });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
});

// Get user topics
router.get('/:id/topics', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const db = getDatabase();

    const topics = await new Promise((resolve, reject) => {
      db.all(`
        SELECT t.*, u.username as author_name
        FROM topics t
        JOIN users u ON t.user_id = u.id
        WHERE t.user_id = ?
        ORDER BY t.last_post_id DESC
        LIMIT ? OFFSET ?
      `, [id, parseInt(limit), offset], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const totalCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM topics WHERE user_id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });

    res.status(200).json({
      success: true,
      topics,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount
      }
    });
  } catch (err) {
    console.error('Error fetching user topics:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch topics'
    });
  }
});

// Get user posts
router.get('/:id/posts', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const db = getDatabase();

    const posts = await new Promise((resolve, reject) => {
      db.all(`
        SELECT p.*, t.title as topic_title
        FROM posts p
        JOIN topics t ON p.topic_id = t.id
        WHERE p.user_id = ?
        AND p.is_deleted = 0
        ORDER BY p.created DESC
        LIMIT ? OFFSET ?
      `, [id, parseInt(limit), offset], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const totalCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM posts WHERE user_id = ? AND is_deleted = 0', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });

    res.status(200).json({
      success: true,
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount
      }
    });
  } catch (err) {
    console.error('Error fetching user posts:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch posts'
    });
  }
});

// List all members
router.get('/members', async (req, res) => {
  try {
    const { page = 1, limit = 50, sort = 'joined' } = req.query;
    const offset = (page - 1) * limit;

    const db = getDatabase();

    // Whitelist for ORDER BY columns to prevent SQL injection
    let orderBy = 'u.joined DESC';
    if (sort === 'username') orderBy = 'u.username';
    else if (sort === 'posts') orderBy = 'post_count DESC';
    else if (sort === 'topics') orderBy = 'topic_count DESC';

    const users = await new Promise((resolve, reject) => {
      db.all(`
        SELECT id, username, email, joined, last_visit, is_active,
               (SELECT COUNT(*) FROM topics WHERE topics.user_id = users.id) as topic_count,
               (SELECT COUNT(*) FROM posts WHERE posts.user_id = users.id AND posts.is_deleted = 0) as post_count
        FROM users
        WHERE is_active = 1
        ORDER BY ${orderBy} DESC
        LIMIT ? OFFSET ?
      `, [parseInt(limit), offset], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const totalCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM users WHERE is_active = 1', [], (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });

    res.status(200).json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount
      }
    });
  } catch (err) {
    console.error('Error fetching members:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch members'
    });
  }
});

module.exports = router;
