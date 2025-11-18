/**
 * Behavior Tracking Routes
 * Track student learning behaviors (clicks, scrolls, interactions)
 */

import { Router } from 'express';
import { BehaviorService } from '../services/behaviorService.js';
import { logger } from '../utils/logger.js';

const router = Router();
const behaviorService = new BehaviorService();

/**
 * POST /api/v1/behavior/track
 * Track behavior events
 */
router.post('/track', async (req, res) => {
  try {
    const { studentId, activityId, events } = req.body;

    const result = await behaviorService.trackBehaviorEvents({
      studentId,
      activityId,
      events
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Error tracking behavior:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/behavior/:studentId/analysis
 * Get behavior analysis for a student
 */
router.get('/:studentId/analysis', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { activityId } = req.query;

    const analysis = await behaviorService.analyzeBehavior(
      studentId,
      activityId as string | undefined
    );

    res.json({
      success: true,
      data: analysis
    });
  } catch (error: any) {
    logger.error('Error analyzing behavior:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export { router as behaviorRoutes };
