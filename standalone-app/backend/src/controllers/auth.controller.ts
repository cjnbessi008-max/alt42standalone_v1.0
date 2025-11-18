import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, queryOne } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  created_at: Date;
}

/**
 * Register new user
 */
export const register = async (req: AuthRequest, res: Response) => {
  const { email, password, name, role = 'student' } = req.body;

  // Validation
  if (!email || !password || !name) {
    throw new AppError('Email, password, and name are required', 400);
  }

  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400);
  }

  // Check if user exists
  const existingUser = await queryOne<User>(
    'SELECT id FROM users WHERE email = ?',
    [email]
  );

  if (existingUser) {
    throw new AppError('User with this email already exists', 409);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert user
  const result: any = await query(
    'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
    [email, hashedPassword, name, role]
  );

  const userId = result.insertId;

  // Generate token
  const token = generateToken(userId, email, role);

  res.status(201).json({
    message: 'User registered successfully',
    token,
    user: {
      id: userId,
      email,
      name,
      role,
    },
  });
};

/**
 * Login user
 */
export const login = async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  // Find user
  const user = await queryOne<User>(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Verify password
  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    throw new AppError('Invalid email or password', 401);
  }

  // Update last login
  await query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

  // Generate token
  const token = generateToken(user.id, user.email, user.role);

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
};

/**
 * Get current user profile
 */
export const getProfile = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const user = await queryOne<User>(
    'SELECT id, email, name, role, created_at, last_login FROM users WHERE id = ?',
    [req.user.id]
  );

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Get user statistics
  const stats: any = await queryOne(
    `SELECT
      COUNT(DISTINCT a.problem_id) as problems_attempted,
      SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) as problems_solved,
      AVG(a.score) as average_score,
      SUM(a.time_spent) as total_time_spent
    FROM attempts a
    WHERE a.user_id = ?`,
    [req.user.id]
  );

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.created_at,
    },
    stats: stats || {
      problems_attempted: 0,
      problems_solved: 0,
      average_score: 0,
      total_time_spent: 0,
    },
  });
};

/**
 * Update user profile
 */
export const updateProfile = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { name, currentPassword, newPassword } = req.body;

  // If changing password, verify current password
  if (newPassword) {
    if (!currentPassword) {
      throw new AppError('Current password required to change password', 400);
    }

    const user = await queryOne<User>(
      'SELECT password FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password);

    if (!validPassword) {
      throw new AppError('Current password is incorrect', 401);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, req.user.id]
    );
  }

  // Update name if provided
  if (name) {
    await query('UPDATE users SET name = ? WHERE id = ?', [name, req.user.id]);
  }

  res.json({
    message: 'Profile updated successfully',
  });
};

/**
 * Generate JWT token
 */
function generateToken(
  id: number,
  email: string,
  role: 'student' | 'teacher' | 'admin'
): string {
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-this';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign({ id, email, role }, secret, { expiresIn });
}
