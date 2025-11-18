const express = require('express');
const router = express.Router();
const moodleService = require('../services/moodleService');

/**
 * Get quiz questions from Moodle
 * GET /api/moodle/questions/:quizId
 */
router.get('/questions/:quizId', async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const questions = await moodleService.getQuizQuestions(quizId);

    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get specific question details
 * GET /api/moodle/question/:questionId
 */
router.get('/question/:questionId', async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const question = await moodleService.getQuestionDetails(questionId);

    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Submit answer to Moodle
 * POST /api/moodle/submit
 */
router.post('/submit', async (req, res, next) => {
  try {
    const { questionId, answer, userId } = req.body;

    if (!questionId || !answer) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: questionId, answer'
      });
    }

    const result = await moodleService.submitAnswer(questionId, answer, userId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get user progress from Moodle
 * GET /api/moodle/progress/:userId/:quizId
 */
router.get('/progress/:userId/:quizId', async (req, res, next) => {
  try {
    const { userId, quizId } = req.params;
    const progress = await moodleService.getUserProgress(userId, quizId);

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Test Moodle connection
 * GET /api/moodle/test
 */
router.get('/test', async (req, res, next) => {
  try {
    const result = await moodleService.testConnection();

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
