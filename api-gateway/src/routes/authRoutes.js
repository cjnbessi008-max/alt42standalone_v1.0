const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const config = require('../config/config');

const router = express.Router();
const pool = new Pool(config.database);

/**
 * POST /api/v1/auth/login
 * User authentication
 */
router.post('/login', async (req, res, next) => {
  const { username, password } = req.body;

  try {
    // For demo purposes - in production, implement proper authentication
    const result = await pool.query(
      'SELECT * FROM ai_education.users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Update last login
    await pool.query(
      'UPDATE ai_education.users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/auth/me
 * Get current user info
 */
router.get('/me', async (req, res) => {
  // Extract token from header
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    res.json({ user: decoded });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
