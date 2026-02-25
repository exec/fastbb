/**
 * Search Routes
 */

const express = require('express');
const router = express.Router();
const cache = require('../middleware/cache');
const { getDatabase } = require('../config/database');

// Search posts and topics
router.get('/', async (req, res) => {
  try {
    const { q, page = 1, limit = 20, type = 'all' } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      });
    }

    const db = getDatabase();
    const offset = (page - 1) * limit;

    // Create search pattern
    const searchPattern = `%${q}%`;

    let results = [];
    let totalCount = 0;

    if (type === 'all' || type === 'posts') {
      const posts = await new Promise((resolve, reject) => {
        db.all(`
          SELECT p.id, p.content, p.created, p.topic_id, p.user_id,
                 u.username,
                 t.title as topic_title,
                 t.forum_id
          FROM posts p
          JOIN users u ON p.user_id = u.id
          JOIN topics t ON p.topic_id = t.id
          WHERE p.is_deleted = 0
          AND p.content LIKE ?
          ORDER BY p.created DESC
          LIMIT ? OFFSET ?
        `, [searchPattern, parseInt(limit), offset], (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(p => ({ ...p, type: 'post' })));
        });
      });

      // Get total count for posts
      const postCount = await new Promise((resolve, reject) => {
        db.get(`
          SELECT COUNT(*) as count
          FROM posts
          WHERE is_deleted = 0
          AND content LIKE ?
        `, [searchPattern], (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        });
      });

      results = [...posts];
      totalCount = postCount;
    }

    if (type === 'all' || type === 'topics') {
      const topics = await new Promise((resolve, reject) => {
        db.all(`
          SELECT t.id, t.title, t.created, t.user_id, t.forum_id,
                 u.username,
                 (SELECT COUNT(*) FROM posts WHERE topic_id = t.id AND is_deleted = 0) as reply_count
          FROM topics t
          JOIN users u ON t.user_id = u.id
          WHERE t.title LIKE ?
          ORDER BY t.last_post_id DESC
          LIMIT ? OFFSET ?
        `, [searchPattern, parseInt(limit), offset], (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(t => ({ ...t, type: 'topic' })));
        });
      });

      results = [...results, ...topics];
    }

    res.status(200).json({
      success: true,
      query: q,
      results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount
      }
    });
  } catch (err) {
    console.error('Error searching:', err);
    res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
});

module.exports = router;
