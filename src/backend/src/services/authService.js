/**
 * Authentication Service
 * Handles user registration, login, and session management
 */

const bcrypt = require('bcryptjs');
const { getDatabase } = require('../config/database');
const { generateToken } = require('../middleware/auth');
const cache = require('../middleware/cache');

/**
 * Sanitize input to prevent XSS and injection attacks
 * @param {string} input - Raw input string
 * @returns {string} - Sanitized input
 */
function sanitizeInput(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }
  // Remove HTML tags
  return input.replace(/<[^>]*>/g, '').trim();
}

/**
 * User salt rounds for bcrypt hashing
 */
const SALT_ROUNDS = 12;

/**
 * Register a new user
 * @param {object} data - User registration data
 * @returns {object} - Created user with token
 */
async function register(data) {
  const db = getDatabase();
  const { username, email, password } = data;

  // Sanitize inputs
  const sanitizedUsername = sanitizeInput(username);
  const sanitizedEmail = sanitizeInput(email);

  // Validate input
  if (!sanitizedUsername || !sanitizedEmail || !password) {
    throw new Error('All fields are required');
  }

  // Validate username format
  if (sanitizedUsername.length < 3 || sanitizedUsername.length > 20) {
    throw new Error('Username must be between 3 and 20 characters');
  }

  if (!/^[a-zA-Z0-9_]+$/.test(sanitizedUsername)) {
    throw new Error('Username can only contain letters, numbers, and underscores');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitizedEmail)) {
    throw new Error('Invalid email format');
  }

  // Validate password strength
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  // Check if username already exists
  const userExists = await new Promise((resolve, reject) => {
    db.get(
      'SELECT id, username, email FROM users WHERE username = ? OR email = ?',
      [sanitizedUsername, sanitizedEmail],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (userExists) {
    if (userExists.username === sanitizedUsername) {
      throw new Error('Username already taken');
    }
    throw new Error('Email already registered');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user with default user group (group_id = 2, which is 'Registered Users')
  const userId = await new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO users (username, email, password_hash, group_id) VALUES (?, ?, ?, 2)',
      [sanitizedUsername, sanitizedEmail, passwordHash],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });

  // Fetch created user
  const user = await new Promise((resolve, reject) => {
    db.get(
      'SELECT id, username, email, group_id, is_active, joined, last_visit FROM users WHERE id = ?',
      [userId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  // Generate authentication token
  const token = generateToken(user);

  // Clear cache entries for this user
  cache.delete(`user:${userId}`);
  cache.delete('users:active');

  return {
    user,
    token,
    message: 'Registration successful'
  };
}

/**
 * Login user
 * @param {object} data - Login credentials
 * @returns {object} - User with token
 */
async function login(data) {
  const db = getDatabase();
  const { usernameOrEmail, password } = data;

  if (!usernameOrEmail || !password) {
    throw new Error('Username/email and password are required');
  }

  // Find user by username or email
  const user = await new Promise((resolve, reject) => {
    db.get(
      'SELECT id, username, email, password_hash, group_id, is_active, last_visit FROM users WHERE username = ? OR email = ?',
      [usernameOrEmail, usernameOrEmail],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check if user is active
  if (!user.is_active) {
    throw new Error('Account has been disabled');
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  // Update last visit time
  await new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET last_visit = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });

  // Clear password hash from response
  delete user.password_hash;

  // Generate authentication token
  const token = generateToken(user);

  // Clear cache entries for this user
  cache.delete(`user:${user.id}`);

  return {
    user,
    token,
    message: 'Login successful'
  };
}

/**
 * Logout user (invalidate token)
 * @param {string} token - Token to invalidate
 * @param {number} userId - User ID
 */
async function logout(token, userId) {
  // In a stateless JWT system, we can't actually invalidate tokens
  // This method exists for future token blacklisting implementation
  // For now, just clear the cache
  cache.delete(`user:${userId}`);
  cache.delete(`session:${token}`);

  return { message: 'Logged out successfully' };
}

/**
 * Get current user from token
 * @param {object} tokenPayload - Decoded JWT payload
 * @returns {object|null} - User object or null
 */
async function getCurrentUser(tokenPayload) {
  if (!tokenPayload || !tokenPayload.id) {
    return null;
  }

  const cacheKey = `user:${tokenPayload.id}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const db = getDatabase();

  const user = await new Promise((resolve, reject) => {
    db.get(
      `SELECT id, username, email, group_id, is_active, joined, last_visit,
              (SELECT COUNT(*) FROM topics WHERE topics.user_id = users.id) as topics_count,
              (SELECT COUNT(*) FROM posts WHERE posts.user_id = users.id AND posts.is_deleted = 0) as posts_count
       FROM users WHERE id = ?`,
      [tokenPayload.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (user) {
    cache.set(cacheKey, user);
  }

  return user;
}

/**
 * Reset password (requires email verification in production)
 * @param {string} email - User email
 * @returns {object} - Reset info
 */
async function requestPasswordReset(email) {
  // In production, this would send an email with a reset token
  // For now, just validate the email exists
  const db = getDatabase();

  const user = await new Promise((resolve, reject) => {
    db.get(
      'SELECT id, email FROM users WHERE email = ?',
      [email],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!user) {
    throw new Error('Email not found');
  }

  // Generate reset token (simplified - would need proper token generation and expiration)
  const resetToken = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');

  return {
    message: 'Password reset link sent (simulated)',
    resetToken
  };
}

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
  requestPasswordReset
};
