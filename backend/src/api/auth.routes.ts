import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { body, validationResult } from 'express-validator';

const router = Router();

/**
 * POST /api/auth/login
 * Login for both teachers and students
 */
router.post(
  '/login',
  [body('email').isEmail(), body('password').isString().isLength({ min: 6 })],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Try to find user in teachers table
      let result = await pool.query('SELECT * FROM teachers WHERE email = $1', [email]);
      let user = result.rows[0];
      let userType = 'teacher';

      // If not found in teachers, try students
      if (!user) {
        result = await pool.query('SELECT * FROM students WHERE email = $1', [email]);
        user = result.rows[0];
        userType = 'student';
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: userType === 'teacher' ? user.role : 'student',
          name: user.name,
        },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: userType === 'teacher' ? user.role : 'student',
          gradeLevel: user.grade_level,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/auth/register
 * Register new student (teachers are created by admins)
 */
router.post(
  '/register',
  [
    body('email').isEmail(),
    body('password').isString().isLength({ min: 6 }),
    body('name').isString().isLength({ min: 2 }),
    body('gradeLevel').optional().isInt({ min: 1, max: 12 }),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name, gradeLevel } = req.body;

      // Check if email already exists
      const existing = await pool.query(
        'SELECT id FROM students WHERE email = $1 UNION SELECT id FROM teachers WHERE email = $1',
        [email]
      );

      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Email already in use' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create student
      const result = await pool.query(
        `
        INSERT INTO students (email, password_hash, name, grade_level)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, name, grade_level
      `,
        [email, passwordHash, name, gradeLevel || null]
      );

      const student = result.rows[0];

      // Generate token
      const token = jwt.sign(
        {
          id: student.id,
          email: student.email,
          role: 'student',
          name: student.name,
        },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.status(201).json({
        success: true,
        token,
        user: {
          id: student.id,
          email: student.email,
          name: student.name,
          role: 'student',
          gradeLevel: student.grade_level,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    res.json({
      success: true,
      user: {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
      },
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
