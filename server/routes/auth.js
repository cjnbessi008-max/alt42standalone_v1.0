import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Database from '../models/Database.js';

const router = express.Router();
const dbManager = new Database();
const db = dbManager.getDb();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password, firstname, lastname, email } = req.body;

    // Validation
    if (!username || !password || !firstname || !lastname || !email) {
      return res.status(400).json({
        error: 'All fields are required'
      });
    }

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?')
      .get(username, email);

    if (existingUser) {
      return res.status(409).json({
        error: 'Username or email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const result = db.prepare(`
      INSERT INTO users (username, password, firstname, lastname, email, role)
      VALUES (?, ?, ?, ?, ?, 'student')
    `).run(username, hashedPassword, firstname, lastname, email);

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: result.lastInsertRowid,
        username,
        role: 'student'
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: result.lastInsertRowid,
        username,
        firstname,
        lastname,
        email,
        role: 'student'
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed'
    });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required'
      });
    }

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user info (requires authentication)
 */
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, username, firstname, lastname, email, role, created_at
      FROM users
      WHERE id = ?
    `).get(req.user.userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({ user });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to get user info'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
router.post('/logout', (req, res) => {
  res.json({
    message: 'Logout successful'
  });
});

/**
 * Middleware to authenticate JWT token
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Access token required'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        error: 'Invalid or expired token'
      });
    }

    req.user = user;
    next();
  });
}

export { authenticateToken };
export default router;
