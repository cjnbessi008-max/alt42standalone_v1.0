const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../middleware/auth');

const router = express.Router();

/**
 * Register new user
 * POST /api/auth/register
 */
router.post('/register', [
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
  body('email').trim().isEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { username, email, password, name } = req.body;

    // Check if user exists
    const [existing] = await db.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Username or email already exists'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await db.query(
      `INSERT INTO users (username, email, password_hash, name, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'student', NOW(), NOW())`,
      [username, email, passwordHash, name]
    );

    const userId = result.insertId;

    // Generate token
    const token = jwt.sign(
      { id: userId, username, role: 'student' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: userId,
          username,
          email,
          name,
          role: 'student'
        }
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

/**
 * Login user
 * POST /api/auth/login
 */
router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { username, password } = req.body;

    // Get user
    const [users] = await db.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const user = users[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Update last login
    await db.query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
          level: user.level
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

/**
 * Guest login (demo mode)
 * POST /api/auth/guest
 */
router.post('/guest', async (req, res) => {
  try {
    // Create temporary guest user
    const guestUsername = `guest_${Date.now()}`;

    const [result] = await db.query(
      `INSERT INTO users (username, email, password_hash, name, role, created_at, updated_at)
       VALUES (?, ?, '', ?, 'guest', NOW(), NOW())`,
      [guestUsername, `${guestUsername}@guest.local`, 'Guest User']
    );

    const userId = result.insertId;

    // Generate token
    const token = jwt.sign(
      { id: userId, username: guestUsername, role: 'guest' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: userId,
          username: guestUsername,
          name: 'Guest User',
          role: 'guest',
          level: 1
        }
      }
    });
  } catch (error) {
    console.error('Guest login error:', error);
    res.status(500).json({
      success: false,
      error: 'Guest login failed'
    });
  }
});

module.exports = router;
