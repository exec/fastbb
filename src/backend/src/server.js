/**
 * FastBB Backend Server
 * High-performance Node.js/Express API server
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const forumRoutes = require('./routes/forums');
const topicRoutes = require('./routes/topics');
const postRoutes = require('./routes/posts');
const searchRoutes = require('./routes/search');
const userRoutes = require('./routes/users');
const systemRoutes = require('./routes/system');

// Import middleware
const { apiLimiter, authLimiter, loginLimiter, registerLimiter } = require('./middleware/rateLimiter');
const { authenticate } = require('./middleware/auth');

// Import database
const { initDatabase, closeDatabase } = require('./config/database');

// Create Express app
const app = express();
const PORT = process.env.PORT || 8080;

// ========================================
// Middleware Configuration
// ========================================

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Body parsing with size limit
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Compression for faster transfers
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting (applied to all API routes)
app.use('/api/', apiLimiter);

// ========================================
// API Routes
// ========================================

// Authentication endpoints
app.post('/api/auth/register', registerLimiter, authRoutes.register);
app.post('/api/auth/login', loginLimiter, authRoutes.login);
app.post('/api/auth/logout', authenticate(), authRoutes.logout);
app.get('/api/auth/me', authenticate(), authRoutes.me);
app.post('/api/auth/reset-password', authRoutes.requestReset);
app.post('/api/auth/reset-password/verify', authRoutes.verifyReset);

// Forums endpoints
app.get('/api/forums', forumRoutes.list);
app.get('/api/forums/:id', forumRoutes.get);
app.post('/api/forums', authenticate(), forumRoutes.create);
app.put('/api/forums/:id', authenticate(), forumRoutes.update);
app.delete('/api/forums/:id', authenticate(), forumRoutes.delete);
app.post('/api/forums/:id/mark-read', authenticate(), forumRoutes.markRead);

// Topics endpoints
app.get('/api/topics/:id', topicRoutes.get);
app.post('/api/topics', authenticate(), topicRoutes.create);
app.put('/api/topics/:id', authenticate(), topicRoutes.update);
app.delete('/api/topics/:id', authenticate(), topicRoutes.delete);
app.post('/api/topics/:id/lock', authenticate(), topicRoutes.lock);
app.post('/api/topics/:id/unlock', authenticate(), topicRoutes.unlock);
app.post('/api/topics/:id/pin', authenticate(), topicRoutes.pin);
app.post('/api/topics/:id/unpin', authenticate(), topicRoutes.unpin);
app.post('/api/topics/:id/views', topicRoutes.incrementViews);

// Posts endpoints
app.get('/api/posts/:id', postRoutes.get);
app.post('/api/posts', authenticate(), postRoutes.create);
app.put('/api/posts/:id', authenticate(), postRoutes.update);
app.delete('/api/posts/:id', authenticate(), postRoutes.delete);

// Search endpoints
app.get('/api/search', searchRoutes.search);

// User endpoints
app.get('/api/users/:id', userRoutes.get);
app.put('/api/users/:id', authenticate(), userRoutes.update);
app.delete('/api/users/:id', authenticate(), userRoutes.delete);
app.get('/api/users/:id/topics', userRoutes.getTopics);
app.get('/api/users/:id/posts', userRoutes.getPosts);
app.get('/api/members', userRoutes.list);

// System endpoints
app.get('/api/system/stats', systemRoutes.stats);
app.get('/api/system/config', systemRoutes.getConfig);
app.post('/api/system/cache/clear', systemRoutes.clearCache);

// ========================================
// Error Handling
// ========================================

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message, err.stack);

  // Handle SQLite errors
  if (err.code === 'SQLITE_BUSY') {
    return res.status(503).json({
      error: 'Database Busy',
      message: 'The database is busy. Please try again later.'
    });
  }

  if (err.code === 'SQLITE_LOCKED') {
    return res.status(503).json({
      error: 'Database Locked',
      message: 'The database is locked. Please try again later.'
    });
  }

  // Send error response
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ========================================
// Server Initialization
// ========================================

async function startServer() {
  try {
    // Initialize database
    await initDatabase();

    console.log(`Database initialized successfully`);

    // Start server
    app.listen(PORT, () => {
      console.log(`FastBB API server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully...');
      await closeDatabase();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down gracefully...');
      await closeDatabase();
      process.exit(0);
    });

  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

// Start server if run directly
if (require.main === module) {
  startServer();
}

module.exports = app;
