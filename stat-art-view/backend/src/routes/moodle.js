const express = require('express');
const router = express.Router();
const moodleService = require('../services/moodleService');

/**
 * GET /api/moodle/quiz/:quizId
 * Moodle API를 통한 퀴즈 정보 조회
 */
router.get('/quiz/:quizId', async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const quizInfo = await moodleService.getQuizInfo(quizId);

    res.json({
      success: true,
      data: quizInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/moodle/test
 * Moodle 연결 테스트
 */
router.get('/test', async (req, res, next) => {
  try {
    const testResult = await moodleService.callMoodleAPI('core_webservice_get_site_info');

    res.json({
      success: true,
      message: 'Moodle connection successful',
      data: {
        sitename: testResult.sitename,
        username: testResult.username,
        release: testResult.release,
        version: testResult.version
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Moodle connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
