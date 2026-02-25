/**
 * Posts Routes
 */

const express = require('express');
const router = express.Router();
const cache = require('../middleware/cache');
const { authenticate } = require('../middleware/auth');
const { getDatabase } = require('../config/database');

/**
 * Sanitize post content to prevent XSS attacks
 * @param {string} content - Raw content
 * @returns {string} - Sanitized content
 */
function sanitizeContent(content) {
  if (!content || typeof content !== 'string') {
    return '';
  }
  // Remove HTML tags
  let sanitized = content.replace(/<[^>]*>/g, '');
  // Remove dangerous URLs
  sanitized = sanitized.replace(/href\s*=\s*["']\s*javascript:/gi, 'href="javascript:void(0)"');
  sanitized = sanitized.replace(/src\s*=\s*["']\s*javascript:/gi, 'src="javascript:void(0)"');
  return sanitized.trim();
}

// Get single post
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const db = getDatabase();

    const post = await new Promise((resolve, reject) => {
      db.get(`
        SELECT p.*,
               u.username,
               u.email,
               u.joined,
               u.is_active,
               t.title as topic_title,
               t.forum_id
        FROM posts p
        JOIN users u ON p.user_id = u.id
        JOIN topics t ON p.topic_id = t.id
        WHERE p.id = ?
        AND p.is_deleted = 0
      `, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    res.status(200).json({
      success: true,
      post
    });
  } catch (err) {
    console.error('Error fetching post:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch post'
    });
  }
});

// Create new post
router.post('/', authenticate(), async (req, res) => {
  try {
    const { topic_id, content } = req.body;

    if (!topic_id || !content) {
      return res.status(400).json({
        success: false,
        error: 'Topic ID and content are required'
      });
    }

    const db = getDatabase();

    // Check if topic exists and is not closed
    const topic = await new Promise((resolve, reject) => {
      db.get('SELECT id, forum_id, closed FROM topics WHERE id = ?', [topic_id], (err, row) => {
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

    if (topic.closed) {
      return res.status(403).json({
        success: false,
        error: 'This topic is closed'
      });
    }

    // Sanitize content to prevent XSS
    const sanitizedContent = sanitizeContent(content);

    // Create post
    const postId = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO posts (topic_id, user_id, content)
        VALUES (?, ?, ?)
      `, [topic_id, req.user.id, sanitizedContent], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });

    // Update topic's last post ID
    db.run('UPDATE topics SET last_post_id = ? WHERE id = ?', [postId, topic_id]);

    // Clear caches
    cache.delete(`topic:${topic_id}`);
    cache.delete(`topic:${topic_id}:posts`);
    cache.delete(`forum:${topic.forum_id}:topics`);

    res.status(201).json({
      success: true,
      id: postId,
      message: 'Post created successfully'
    });
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to create post'
    });
  }
});

// Update post
router.put('/:id', authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const db = getDatabase();

    // Check if post exists and belongs to user
    const post = await new Promise((resolve, reject) => {
      db.get('SELECT id, user_id, topic_id FROM posts WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Check permissions
    if (post.user_id !== req.user.id && req.user.group_id !== 1) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this post'
      });
    }

    // Sanitize content to prevent XSS
    const sanitizedContent = sanitizeContent(content);

    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE posts
        SET content = ?, edited = CURRENT_TIMESTAMP, is_edited = 1
        WHERE id = ?
      `, [sanitizedContent, id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Clear cache
    cache.delete(`post:${id}`);

    res.status(200).json({
      success: true,
      message: 'Post updated successfully'
    });
  } catch (err) {
    console.error('Error updating post:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update post'
    });
  }
});

// Delete post
router.delete('/:id', authenticate(), async (req, res) => {
  try {
    const { id } = req.params;

    const db = getDatabase();

    // Check if post exists
    const post = await new Promise((resolve, reject) => {
      db.get('SELECT id, topic_id, user_id FROM posts WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Check permissions
    if (post.user_id !== req.user.id && req.user.group_id !== 1) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this post'
      });
    }

    // Soft delete post
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE posts
        SET is_deleted = 1, deleted_reason = ?
        WHERE id = ?
      `, ['Deleted by user', id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Clear cache
    cache.delete(`post:${id}`);
    cache.delete(`topic:${post.topic_id}`);

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to delete post'
    });
  }
});

module.exports = router;
