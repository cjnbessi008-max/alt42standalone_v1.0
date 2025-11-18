/**
 * Activity Routes
 * 학습 활동 로그 API
 */

const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { authenticateToken } = require('../middleware/auth');

// 모든 activity 라우트는 인증 필요
router.use(authenticateToken);

// 활동 로그 조회
router.get('/logs', activityController.getLogs);

// 활동 로그 생성
router.post('/logs', activityController.createLog);

// 실시간 로그 스트림 (SSE)
router.get('/stream', activityController.streamLogs);

// 사용자별 통계
router.get('/stats/:userId', activityController.getUserStats);

// 전체 통계
router.get('/stats', activityController.getOverallStats);

module.exports = router;
