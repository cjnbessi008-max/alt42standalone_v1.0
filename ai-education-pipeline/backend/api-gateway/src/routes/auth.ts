/**
 * Authentication Routes
 */

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../database';
import { ApiError } from '../middleware/errorHandler';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * POST /api/auth/register
 * Register a new teacher account
 */
authRouter.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').trim().notEmpty(),
    body('institution').optional().trim()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError('Validation failed', 400);
    }

    const { email, password, name, institution } = req.body;

    try {
      // Check if user exists
      const existing = await db.query(
        'SELECT id FROM teachers WHERE email = $1',
        [email]
      );

      if (existing.rows.length > 0) {
        throw new ApiError('Email already registered', 409);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const result = await db.query(
        `INSERT INTO teachers (email, password_hash, name, institution, role)
         VALUES ($1, $2, $3, $4, 'teacher')
         RETURNING id, email, name, institution, role, created_at`,
        [email, hashedPassword, name, institution || null]
      );

      const user = result.rows[0];

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          institution: user.institution,
          role: user.role
        },
        token
      });
    } catch (error) {
      throw error;
    }
  }
);

/**
 * POST /api/auth/login
 * Login with email and password
 */
authRouter.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError('Validation failed', 400);
    }

    const { email, password } = req.body;

    try {
      // Find user
      const result = await db.query(
        'SELECT * FROM teachers WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        throw new ApiError('Invalid credentials', 401);
      }

      const user = result.rows[0];

      // Verify password
      const isValid = await bcrypt.compare(password, user.password_hash);

      if (!isValid) {
        throw new ApiError('Invalid credentials', 401);
      }

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          institution: user.institution,
          role: user.role
        },
        token
      });
    } catch (error) {
      throw error;
    }
  }
);

/**
 * GET /api/auth/me
 * Get current user profile
 */
authRouter.get('/me', async (req: Request, res: Response) => {
  // TODO: Implement authentication middleware
  res.json({
    success: true,
    message: 'Protected route - implement auth middleware'
  });
});
