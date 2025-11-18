/**
 * Learning Activity Tracking Routes
 */

import { Router } from 'express';
import { ActivityService } from '../services/activityService.js';
import { logger } from '../utils/logger.js';
import { ActivityType } from '../../../shared/types/index.js';

const router = Router();
const activityService = new ActivityService();

/**
 * POST /api/v1/activity/start
 * Start a new learning activity
 */
router.post('/start', async (req, res) => {
  try {
    const { studentId, moduleId, activityType, activityName, metadata } = req.body;

    const activity = await activityService.startActivity({
      studentId,
      moduleId,
      activityType,
      activityName,
      metadata
    });

    res.json({
      success: true,
      data: activity
    });
  } catch (error: any) {
    logger.error('Error starting activity:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/activity/complete
 * Complete an activity
 */
router.post('/complete', async (req, res) => {
  try {
    const { activityId, studentId, outcome, metadata } = req.body;

    const activity = await activityService.completeActivity({
      activityId,
      studentId,
      outcome,
      metadata
    });

    res.json({
      success: true,
      data: activity
    });
  } catch (error: any) {
    logger.error('Error completing activity:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/activity/:studentId/current
 * Get current active activity for a student
 */
router.get('/:studentId/current', async (req, res) => {
  try {
    const { studentId } = req.params;
    const activity = await activityService.getCurrentActivity(studentId);

    res.json({
      success: true,
      data: activity
    });
  } catch (error: any) {
    logger.error('Error getting current activity:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/activity/:studentId/history
 * Get activity history for a student
 */
router.get('/:studentId/history', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const activities = await activityService.getActivityHistory(
      studentId,
      Number(limit),
      Number(offset)
    );

    res.json({
      success: true,
      data: activities
    });
  } catch (error: any) {
    logger.error('Error getting activity history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export { router as activityRoutes };
