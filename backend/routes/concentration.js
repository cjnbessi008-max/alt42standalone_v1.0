/**
 * Concentration Tracking API Routes
 *
 * Endpoints for concentration score calculation and bypass management
 */

import express from 'express';
import {
  calculateConcentrationScore,
  checkBypassNeeded,
  getEasierProblem,
  logBypassEvent,
  updateBypassEvent,
  getConcentrationStatus
} from '../services/concentration-service.js';

const router = express.Router();

/**
 * GET /api/concentration/:studentId/:moduleId
 * Get current concentration status for a student in a module
 */
router.get('/:studentId/:moduleId', async (req, res) => {
  try {
    const { studentId, moduleId } = req.params;

    const status = await getConcentrationStatus(studentId, moduleId);

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Error getting concentration status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get concentration status',
      message: error.message
    });
  }
});

/**
 * POST /api/concentration/calculate
 * Calculate fresh concentration score
 * Body: { studentId, moduleId, recentAttemptsWindow? }
 */
router.post('/calculate', async (req, res) => {
  try {
    const { studentId, moduleId, recentAttemptsWindow } = req.body;

    if (!studentId || !moduleId) {
      return res.status(400).json({
        success: false,
        error: 'studentId and moduleId are required'
      });
    }

    const score = await calculateConcentrationScore(
      studentId,
      moduleId,
      recentAttemptsWindow || 5
    );

    res.json({
      success: true,
      data: score
    });

  } catch (error) {
    console.error('Error calculating concentration score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate concentration score',
      message: error.message
    });
  }
});

/**
 * POST /api/concentration/check-bypass
 * Check if bypass should be offered
 * Body: { studentId, moduleId, currentProblemId }
 */
router.post('/check-bypass', async (req, res) => {
  try {
    const { studentId, moduleId, currentProblemId } = req.body;

    if (!studentId || !moduleId || !currentProblemId) {
      return res.status(400).json({
        success: false,
        error: 'studentId, moduleId, and currentProblemId are required'
      });
    }

    const bypassCheck = await checkBypassNeeded(studentId, moduleId, currentProblemId);

    res.json({
      success: true,
      data: bypassCheck
    });

  } catch (error) {
    console.error('Error checking bypass:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check bypass',
      message: error.message
    });
  }
});

/**
 * POST /api/concentration/offer-bypass
 * Offer bypass to student and get easier problem
 * Body: { studentId, moduleId, originalProblemId, originalDifficulty, triggerReason, concentrationScore }
 */
router.post('/offer-bypass', async (req, res) => {
  try {
    const {
      studentId,
      moduleId,
      originalProblemId,
      originalDifficulty,
      triggerReason,
      concentrationScore,
      difficultyReduction
    } = req.body;

    if (!studentId || !moduleId || !originalProblemId || !originalDifficulty) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Get easier problem
    const easierProblem = await getEasierProblem(
      moduleId,
      originalDifficulty,
      difficultyReduction || 1
    );

    if (!easierProblem) {
      return res.status(404).json({
        success: false,
        error: 'No easier problem available'
      });
    }

    // Log bypass offer
    const bypassEvent = await logBypassEvent({
      studentId,
      moduleId,
      originalProblemId,
      bypassProblemId: easierProblem.id,
      triggerReason,
      concentrationScore,
      originalDifficulty,
      bypassDifficulty: easierProblem.difficulty_level,
      accepted: null // Not yet accepted/declined
    });

    res.json({
      success: true,
      data: {
        bypassEvent,
        easierProblem,
        message: getBypassMessage(triggerReason, originalDifficulty, easierProblem.difficulty_level)
      }
    });

  } catch (error) {
    console.error('Error offering bypass:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to offer bypass',
      message: error.message
    });
  }
});

/**
 * PUT /api/concentration/bypass/:bypassEventId/accept
 * Student accepts bypass offer
 */
router.put('/bypass/:bypassEventId/accept', async (req, res) => {
  try {
    const { bypassEventId } = req.params;

    const updatedEvent = await updateBypassEvent(bypassEventId, {
      accepted: true
    });

    res.json({
      success: true,
      data: updatedEvent,
      message: 'Bypass accepted successfully'
    });

  } catch (error) {
    console.error('Error accepting bypass:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept bypass',
      message: error.message
    });
  }
});

/**
 * PUT /api/concentration/bypass/:bypassEventId/decline
 * Student declines bypass offer
 */
router.put('/bypass/:bypassEventId/decline', async (req, res) => {
  try {
    const { bypassEventId } = req.params;

    const updatedEvent = await updateBypassEvent(bypassEventId, {
      accepted: false
    });

    res.json({
      success: true,
      data: updatedEvent,
      message: 'Bypass declined'
    });

  } catch (error) {
    console.error('Error declining bypass:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to decline bypass',
      message: error.message
    });
  }
});

/**
 * PUT /api/concentration/bypass/:bypassEventId/complete
 * Mark bypass problem as completed
 * Body: { success: boolean, returnToOriginal?: boolean }
 */
router.put('/bypass/:bypassEventId/complete', async (req, res) => {
  try {
    const { bypassEventId } = req.params;
    const { success, returnToOriginal } = req.body;

    const updatedEvent = await updateBypassEvent(bypassEventId, {
      bypassCompleted: true,
      bypassSuccess: success,
      returnedToOriginal: returnToOriginal || false
    });

    res.json({
      success: true,
      data: updatedEvent,
      message: success
        ? 'Great job! You completed the easier problem.'
        : 'Keep trying! You can do it.'
    });

  } catch (error) {
    console.error('Error completing bypass:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete bypass',
      message: error.message
    });
  }
});

/**
 * Helper function to generate user-friendly bypass messages
 */
function getBypassMessage(triggerReason, originalDifficulty, bypassDifficulty) {
  const messages = {
    low_concentration: {
      ko: `집중력이 조금 떨어진 것 같아요. 레벨 ${bypassDifficulty}의 쉬운 문제로 다시 자신감을 찾아볼까요?`,
      en: `Your concentration seems to be dropping. Would you like to try an easier level ${bypassDifficulty} problem to regain confidence?`
    },
    multiple_failures: {
      ko: `이 문제가 어려운 것 같네요. 레벨 ${bypassDifficulty}의 더 쉬운 문제로 연습한 후 다시 도전해볼까요?`,
      en: `This problem seems challenging. Let's practice with an easier level ${bypassDifficulty} problem first, then come back to this one.`
    },
    excessive_time: {
      ko: `이 문제에 시간이 많이 걸리고 있어요. 레벨 ${bypassDifficulty}의 쉬운 문제로 기초를 다져볼까요?`,
      en: `You're spending a lot of time on this problem. Would you like to strengthen your foundation with a level ${bypassDifficulty} problem?`
    }
  };

  return messages[triggerReason] || {
    ko: `레벨 ${bypassDifficulty}의 쉬운 문제로 연습해볼까요?`,
    en: `Would you like to try an easier level ${bypassDifficulty} problem?`
  };
}

export default router;
