import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../config/database';
import { generateToken, generateRefreshToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { User, AuthRequest } from '../types';

export const register = async (req: Request, res: Response) => {
  const { email, username, password, full_name, role, grade_level, institution } = req.body;

  // Validation
  if (!email || !username || !password) {
    throw new AppError('Email, username, and password are required', 400);
  }

  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters long', 400);
  }

  // Check if user already exists
  const existingUser = await query(
    'SELECT id FROM users WHERE email = $1 OR username = $2',
    [email, username]
  );

  if (existingUser.rows.length > 0) {
    throw new AppError('Email or username already exists', 409);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Insert new user
  const result = await query(
    `INSERT INTO users (email, username, password_hash, full_name, role, grade_level, institution)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, email, username, full_name, role, grade_level, institution, created_at`,
    [email, username, passwordHash, full_name, role || 'student', grade_level, institution]
  );

  const user = result.rows[0];

  // Generate tokens
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        grade_level: user.grade_level,
        institution: user.institution,
      },
      token,
      refreshToken,
    },
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  // Find user
  const result = await query(
    'SELECT * FROM users WHERE email = $1 AND is_active = true',
    [email]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid credentials', 401);
  }

  const user = result.rows[0] as User & { password_hash: string };

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    throw new AppError('Invalid credentials', 401);
  }

  // Update last login
  await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

  // Generate tokens
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        grade_level: user.grade_level,
        institution: user.institution,
      },
      token,
      refreshToken,
    },
  });
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  const result = await query(
    'SELECT id, email, username, full_name, role, grade_level, institution, created_at, last_login, preferences FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: result.rows[0],
  });
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { full_name, grade_level, institution, preferences } = req.body;

  const result = await query(
    `UPDATE users
     SET full_name = COALESCE($1, full_name),
         grade_level = COALESCE($2, grade_level),
         institution = COALESCE($3, institution),
         preferences = COALESCE($4, preferences),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $5
     RETURNING id, email, username, full_name, role, grade_level, institution, preferences`,
    [full_name, grade_level, institution, preferences, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: result.rows[0],
  });
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required', 400);
  }

  if (newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters long', 400);
  }

  // Get current password hash
  const result = await query(
    'SELECT password_hash FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  const user = result.rows[0];

  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

  if (!isValidPassword) {
    throw new AppError('Current password is incorrect', 401);
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  // Update password
  await query(
    'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [newPasswordHash, userId]
  );

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
};
