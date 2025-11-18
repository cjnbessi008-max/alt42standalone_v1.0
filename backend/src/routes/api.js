/**
 * API Routes
 * Unfolding Net Live API 라우트 정의
 */

import express from 'express';
import {
  getProblem,
  getProblems,
  saveProgress,
  createProblem,
} from '../controllers/problemController.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Unfolding Net API is running',
    timestamp: Date.now(),
  });
});

// Problem routes
router.get('/problems', getProblem); // GET /api/problems?courseId=X&moduleId=Y
router.get('/courses/:courseId/problems', getProblems); // GET /api/courses/:courseId/problems
router.post('/problems', createProblem); // POST /api/problems
router.post('/progress', saveProgress); // POST /api/progress

// Auth routes (간단한 구현)
router.post('/auth/login', (req, res) => {
  const { username, password } = req.body;

  // TODO: 실제 인증 로직 구현
  // 현재는 더미 토큰 반환
  if (username && password) {
    return res.json({
      success: true,
      data: {
        token: `dummy_token_${Date.now()}`,
      },
      timestamp: Date.now(),
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Invalid credentials',
    timestamp: Date.now(),
  });
});

export default router;
