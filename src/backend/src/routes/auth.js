/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const { register, login, logout, getCurrentUser, requestPasswordReset } = require('../services/authService');
const { authenticate } = require('../middleware/auth');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const result = await register(req.body);
    res.status(201).json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const result = await login(req.body);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(401).json({
      success: false,
      error: err.message
    });
  }
});

// Logout user
router.post('/logout', authenticate(), async (req, res) => {
  try {
    const result = await logout(req.token, req.user.id);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Get current user
router.get('/me', authenticate(), async (req, res) => {
  try {
    const user = await getCurrentUser(req.user);
    res.status(200).json({
      success: true,
      user
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Request password reset
router.post('/reset-password', async (req, res) => {
  try {
    const result = await requestPasswordReset(req.body.email);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;
