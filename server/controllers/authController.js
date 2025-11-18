/**
 * Authentication Controller
 * 사용자 인증 및 관리
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/database');
const { v4: uuidv4 } = require('uuid');

/**
 * 회원가입
 */
async function register(req, res) {
  try {
    const { username, email, password, role = 'student' } = req.body;

    // 입력 검증
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username, email and password are required'
      });
    }

    // 이메일 중복 확인
    const existingUser = await db.queryOne(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Email already exists'
      });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const userId = uuidv4();
    await db.query(
      `INSERT INTO users (id, username, email, password, role, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [userId, username, email, hashedPassword, role]
    );

    // JWT 토큰 생성
    const token = generateAccessToken(userId, email, role);
    const refreshToken = generateRefreshToken(userId);

    // Refresh 토큰 저장
    await saveRefreshToken(userId, refreshToken);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        userId,
        username,
        email,
        role,
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: error.message
    });
  }
}

/**
 * 로그인
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // 사용자 조회
    const user = await db.queryOne(
      'SELECT id, username, email, password, role, is_active FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Account is disabled'
      });
    }

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // JWT 토큰 생성
    const token = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Refresh 토큰 저장
    await saveRefreshToken(user.id, refreshToken);

    // 마지막 로그인 시간 업데이트
    await db.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = ?',
      [user.id]
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: error.message
    });
  }
}

/**
 * 토큰 갱신
 */
async function refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    // Refresh 토큰 검증
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // DB에서 Refresh 토큰 확인
    const storedToken = await db.queryOne(
      'SELECT user_id FROM refresh_tokens WHERE token = ? AND expires_at > NOW()',
      [refreshToken]
    );

    if (!storedToken) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    // 사용자 정보 조회
    const user = await db.queryOne(
      'SELECT id, email, role FROM users WHERE id = ? AND is_active = 1',
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // 새 Access 토큰 생성
    const newToken = generateAccessToken(user.id, user.email, user.role);

    res.json({
      success: true,
      data: {
        token: newToken
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token',
      message: error.message
    });
  }
}

/**
 * 로그아웃
 */
async function logout(req, res) {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Refresh 토큰 삭제
      await db.query(
        'DELETE FROM refresh_tokens WHERE token = ?',
        [refreshToken]
      );
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      message: error.message
    });
  }
}

/**
 * 현재 사용자 정보 조회
 */
async function getCurrentUser(req, res) {
  try {
    const user = await db.queryOne(
      `SELECT id, username, email, role, created_at, last_login_at
       FROM users WHERE id = ?`,
      [req.user.userId]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user information',
      message: error.message
    });
  }
}

/**
 * 비밀번호 변경
 */
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    // 현재 비밀번호 확인
    const user = await db.queryOne(
      'SELECT password FROM users WHERE id = ?',
      [req.user.userId]
    );

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // 새 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 비밀번호 업데이트
    await db.query(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, req.user.userId]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password',
      message: error.message
    });
  }
}

/**
 * Access Token 생성
 */
function generateAccessToken(userId, email, role) {
  return jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

/**
 * Refresh Token 생성
 */
function generateRefreshToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}

/**
 * Refresh Token 저장
 */
async function saveRefreshToken(userId, token) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7일 후 만료

  await db.query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at, created_at)
     VALUES (?, ?, ?, NOW())`,
    [userId, token, expiresAt]
  );
}

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser,
  changePassword
};
