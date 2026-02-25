/**
 * JWT Authentication Middleware
 * Handles token verification and user authentication
 */

const jwt = require('jsonwebtoken');

// Check if JWT_SECRET is configured - throw error if not
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('Error: JWT_SECRET environment variable is required but not set.');
  console.error('Please set JWT_SECRET in your .env file with a strong random string.');
  process.exit(1);
}

const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

/**
 * Generate JWT token
 * @param {object} user - User object
 * @returns {string} - JWT token
 */
function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    group_id: user.group_id,
    is_active: user.is_active
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
    issuer: 'FastBB'
  });
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded payload or null
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Extract token from request headers
 * @param {object} req - Express request
 * @returns {string|null} - Token or null
 */
function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  // Bearer token format: "Bearer <token>"
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Authentication middleware
 * Attaches current user to request object
 */
function authenticate() {
  return (req, res, next) => {
    const token = extractToken(req);

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      req.user = null;
      return next();
    }

    // Verify user still exists and is active
    req.user = decoded;
    req.token = token;
    next();
  };
}

/**
 * Role-based authorization middleware
 * @param {...string} roles - Allowed roles
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (roles.length > 0 && !roles.includes(req.user.group_id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
}

/**
 * Admin-only authorization
 */
function requireAdmin() {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.user.group_id !== 1) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
}

/**
 * Guest-only middleware (block logged-in users)
 */
function requireGuest() {
  return (req, res, next) => {
    if (req.user) {
      return res.status(403).json({ error: 'Already logged in' });
    }

    next();
  };
}

module.exports = {
  generateToken,
  verifyToken,
  extractToken,
  authenticate,
  authorize,
  requireAdmin,
  requireGuest,
  JWT_SECRET,
  JWT_EXPIRY
};
