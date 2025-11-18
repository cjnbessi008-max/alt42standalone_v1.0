const express = require('express');
const router = express.Router();

/**
 * GET /api/praise/messages
 * Get all available praise messages by category
 */
router.get('/messages', (req, res) => {
  const praiseMessages = require('../data/praiseMessages');
  res.json({
    success: true,
    categories: Object.keys(praiseMessages),
    messages: praiseMessages
  });
});

/**
 * GET /api/praise/rules
 * Get all praise rules configuration
 */
router.get('/rules', (req, res) => {
  const praiseRules = require('../config/praiseRules');
  res.json({
    success: true,
    totalRules: praiseRules.length,
    rules: praiseRules.map(rule => ({
      type: rule.type,
      messageCategory: rule.messageCategory
    }))
  });
});

/**
 * GET /api/praise/history/:studentId/:moduleId
 * Get praise history for a specific student in a module
 */
router.get('/history/:studentId/:moduleId', (req, res) => {
  const { studentId, moduleId } = req.params;

  // Access PraiseService from app locals (set in server/index.js)
  const praiseService = req.app.get('praiseService');

  if (!praiseService) {
    return res.status(500).json({
      success: false,
      error: 'Praise service not initialized'
    });
  }

  const history = praiseService.getStudentHistory(studentId, moduleId);

  if (!history) {
    return res.json({
      success: true,
      studentId,
      moduleId,
      history: null,
      message: 'No history found for this student'
    });
  }

  res.json({
    success: true,
    studentId,
    moduleId,
    history: {
      totalAttempts: history.totalAttempts,
      correctAnswers: history.correctAnswers,
      consecutiveCorrect: history.consecutiveCorrect,
      accuracy: history.totalAttempts > 0
        ? (history.correctAnswers / history.totalAttempts * 100).toFixed(1)
        : 0,
      achievementsCount: history.achievements.length,
      lastPraise: history.lastPraiseTime
        ? new Date(history.lastPraiseTime).toISOString()
        : null
    }
  });
});

/**
 * POST /api/praise/reset/:studentId/:moduleId
 * Reset praise history for a student (for testing or module restart)
 */
router.post('/reset/:studentId/:moduleId', (req, res) => {
  const { studentId, moduleId } = req.params;
  const praiseService = req.app.get('praiseService');

  if (!praiseService) {
    return res.status(500).json({
      success: false,
      error: 'Praise service not initialized'
    });
  }

  praiseService.resetStudentHistory(studentId, moduleId);

  res.json({
    success: true,
    message: `History reset for student ${studentId} in module ${moduleId}`
  });
});

module.exports = router;
