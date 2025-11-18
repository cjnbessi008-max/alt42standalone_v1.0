/**
 * Recommendation Routes
 * AI 기반 문제 추천 시스템
 */

const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const { authenticateToken } = require('../middleware/auth');

// 인증 필요
router.use(authenticateToken);

// 사용자 맞춤 문제 추천
router.get('/problems', recommendationController.getRecommendedProblems);

// 다음 난이도 추천
router.get('/next-level', recommendationController.getNextLevel);

// 취약점 분석 기반 추천
router.get('/weak-areas', recommendationController.getWeakAreasRecommendation);

module.exports = router;
