/**
 * Authentication Routes
 * JWT 기반 인증 시스템
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// 회원가입
router.post('/register', authController.register);

// 로그인
router.post('/login', authController.login);

// 토큰 갱신
router.post('/refresh', authController.refreshToken);

// 로그아웃
router.post('/logout', authenticateToken, authController.logout);

// 현재 사용자 정보
router.get('/me', authenticateToken, authController.getCurrentUser);

// 비밀번호 변경
router.post('/change-password', authenticateToken, authController.changePassword);

module.exports = router;
