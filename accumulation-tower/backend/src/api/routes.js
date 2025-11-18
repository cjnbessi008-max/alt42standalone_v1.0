const express = require('express');
const { body, param, validationResult } = require('express-validator');
const moodleService = require('../services/moodleService');

const router = express.Router();

/**
 * 유효성 검사 결과 처리 미들웨어
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * GET /api/health
 * 서버 상태 확인
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Accumulation Tower API'
  });
});

/**
 * GET /api/user/:userId
 * 사용자 정보 조회
 */
router.get(
  '/user/:userId',
  [
    param('userId').isInt({ min: 1 }).withMessage('Valid user ID is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const userInfo = await moodleService.getUserInfo(parseInt(userId));

      if (!userInfo) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        id: userInfo.id,
        fullname: userInfo.fullname,
        email: userInfo.email
      });
    } catch (error) {
      console.error('Error fetching user info:', error);
      res.status(500).json({ error: 'Failed to fetch user information' });
    }
  }
);

/**
 * GET /api/accumulation/:userId/:courseId
 * 사용자의 누적 점수 및 타워 데이터 조회
 */
router.get(
  '/accumulation/:userId/:courseId',
  [
    param('userId').isInt({ min: 1 }).withMessage('Valid user ID is required'),
    param('courseId').isInt({ min: 1 }).withMessage('Valid course ID is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { userId, courseId } = req.params;
      const towerData = await moodleService.getAccumulationScore(
        parseInt(userId),
        parseInt(courseId)
      );

      res.json(towerData);
    } catch (error) {
      console.error('Error fetching accumulation data:', error);
      res.status(500).json({ error: 'Failed to fetch accumulation data' });
    }
  }
);

/**
 * GET /api/grades/:userId/:courseId
 * 사용자의 상세 성적 정보 조회
 */
router.get(
  '/grades/:userId/:courseId',
  [
    param('userId').isInt({ min: 1 }).withMessage('Valid user ID is required'),
    param('courseId').isInt({ min: 1 }).withMessage('Valid course ID is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { userId, courseId } = req.params;
      const gradeData = await moodleService.getUserGrades(
        parseInt(userId),
        parseInt(courseId)
      );

      if (!gradeData) {
        return res.status(404).json({ error: 'No grade data found' });
      }

      res.json(gradeData);
    } catch (error) {
      console.error('Error fetching grades:', error);
      res.status(500).json({ error: 'Failed to fetch grade data' });
    }
  }
);

/**
 * GET /api/quizzes/:courseId
 * 코스의 퀴즈 목록 조회
 */
router.get(
  '/quizzes/:courseId',
  [
    param('courseId').isInt({ min: 1 }).withMessage('Valid course ID is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const quizzes = await moodleService.getCourseQuizzes(parseInt(courseId));

      res.json({ quizzes });
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      res.status(500).json({ error: 'Failed to fetch quiz data' });
    }
  }
);

/**
 * GET /api/quiz-attempts/:quizId/:userId
 * 퀴즈 시도 정보 조회
 */
router.get(
  '/quiz-attempts/:quizId/:userId',
  [
    param('quizId').isInt({ min: 1 }).withMessage('Valid quiz ID is required'),
    param('userId').isInt({ min: 1 }).withMessage('Valid user ID is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { quizId, userId } = req.params;
      const attempts = await moodleService.getQuizAttempts(
        parseInt(quizId),
        parseInt(userId)
      );

      res.json({ attempts });
    } catch (error) {
      console.error('Error fetching quiz attempts:', error);
      res.status(500).json({ error: 'Failed to fetch quiz attempt data' });
    }
  }
);

module.exports = router;
