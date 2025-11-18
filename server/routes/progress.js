const express = require('express');
const router = express.Router();

/**
 * POST /api/progress/submit
 * Submit student progress and trigger praise evaluation
 * This is typically called from the client after a student answers a question
 */
router.post('/submit', async (req, res) => {
  const { studentId, moduleId, progressData } = req.body;

  // Validation
  if (!studentId || !moduleId || !progressData) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: studentId, moduleId, progressData'
    });
  }

  const praiseService = req.app.get('praiseService');

  if (!praiseService) {
    return res.status(500).json({
      success: false,
      error: 'Praise service not initialized'
    });
  }

  try {
    // Evaluate if praise should be triggered
    const praiseEvent = await praiseService.evaluateProgress(
      studentId,
      moduleId,
      progressData
    );

    // Get current history
    const history = praiseService.getStudentHistory(studentId, moduleId);

    res.json({
      success: true,
      progressRecorded: true,
      praiseTriggered: !!praiseEvent,
      praiseEvent: praiseEvent,
      currentStats: {
        totalAttempts: history.totalAttempts,
        correctAnswers: history.correctAnswers,
        consecutiveCorrect: history.consecutiveCorrect,
        accuracy: history.totalAttempts > 0
          ? (history.correctAnswers / history.totalAttempts * 100).toFixed(1)
          : 0
      }
    });
  } catch (error) {
    console.error('Error processing progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process progress',
      details: error.message
    });
  }
});

/**
 * GET /api/progress/:studentId/:moduleId
 * Get current progress for a student in a module
 */
router.get('/:studentId/:moduleId', (req, res) => {
  const { studentId, moduleId } = req.params;
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
      progress: {
        totalAttempts: 0,
        correctAnswers: 0,
        consecutiveCorrect: 0,
        accuracy: 0
      }
    });
  }

  res.json({
    success: true,
    studentId,
    moduleId,
    progress: {
      totalAttempts: history.totalAttempts,
      correctAnswers: history.correctAnswers,
      consecutiveCorrect: history.consecutiveCorrect,
      accuracy: history.totalAttempts > 0
        ? (history.correctAnswers / history.totalAttempts * 100).toFixed(1)
        : 0,
      achievementsCount: history.achievements.length
    }
  });
});

module.exports = router;
