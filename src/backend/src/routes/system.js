/**
 * System Routes
 */

const express = require('express');
const router = express.Router();
const cache = require('../middleware/cache');
const { getDatabase } = require('../config/database');

// Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const db = getDatabase();

    // Get total counts
    const [totalUsers, totalForums, totalTopics, totalPosts] = await Promise.all([
      new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM users WHERE is_active = 1', [], (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        });
      }),
      new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM forums WHERE is_active = 1', [], (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        });
      }),
      new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM topics', [], (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        });
      }),
      new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM posts WHERE is_deleted = 0', [], (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        });
      })
    ]);

    // Get newest member
    const newestMember = await new Promise((resolve, reject) => {
      db.get(`
        SELECT id, username, joined
        FROM users
        WHERE is_active = 1
        ORDER BY joined DESC
        LIMIT 1
      `, [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    // Get forum statistics
    const forumStats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT
          (SELECT COUNT(*) FROM forums WHERE is_active = 1) as total_forums,
          (SELECT COUNT(*) FROM topics) as total_topics,
          (SELECT COUNT(*) FROM posts WHERE is_deleted = 0) as total_posts
      `, [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    res.status(200).json({
      success: true,
      stats: {
        total_users: totalUsers,
        total_forums: totalForums,
        total_topics: totalTopics,
        total_posts: totalPosts,
        newest_member: newestMember,
        ...forumStats
      }
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

// Get system configuration
router.get('/config', async (req, res) => {
  try {
    // Get config from environment and defaults
    const config = {
      site_name: process.env.SITE_NAME || 'FastBB Forum',
      site_url: process.env.SITE_URL || 'http://localhost:8080',
      admin_email: process.env.ADMIN_EMAIL || 'admin@localhost',
      enable_registration: process.env.ENABLE_REGISTRATION !== 'false',
      enable_search: process.env.ENABLE_SEARCH !== 'false',
      posts_per_page: parseInt(process.env.POSTS_PER_PAGE) || 20,
      topics_per_page: parseInt(process.env.TOPICS_PER_PAGE) || 20,
      default_theme: process.env.DEFAULT_THEME || 'default',
      enable_dark_mode: process.env.ENABLE_DARK_MODE !== 'false',
      maintenance_mode: process.env.MAINTENANCE_MODE === 'true'
    };

    res.status(200).json({
      success: true,
      config
    });
  } catch (err) {
    console.error('Error fetching config:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch configuration'
    });
  }
});

// Clear cache
router.post('/cache/clear', async (req, res) => {
  try {
    cache.clear();

    res.status(200).json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (err) {
    console.error('Error clearing cache:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache'
    });
  }
});

// Health check
router.get('/health', async (req, res) => {
  try {
    const db = getDatabase();

    // Check database connection
    await new Promise((resolve, reject) => {
      db.run('SELECT 1', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.status(200).json({
      success: true,
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Health check failed:', err);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      database: 'disconnected',
      error: err.message
    });
  }
});

module.exports = router;
