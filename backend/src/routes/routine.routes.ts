import { Router, Request, Response } from 'express';
import routineService from '../services/routine.service';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/v1/routines/types
 * Get all active routine types
 */
router.get('/types', async (req: Request, res: Response) => {
  try {
    const routineTypes = await routineService.getAllRoutineTypes();
    res.json({
      success: true,
      data: routineTypes,
    });
  } catch (error) {
    logger.error('Error fetching routine types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch routine types',
    });
  }
});

/**
 * GET /api/v1/routines/types/category/:category
 * Get routine types by category
 */
router.get('/types/category/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const routineTypes = await routineService.getRoutineTypesByCategory(category);
    res.json({
      success: true,
      data: routineTypes,
    });
  } catch (error) {
    logger.error('Error fetching routine types by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch routine types',
    });
  }
});

/**
 * GET /api/v1/routines/recommend/:userId
 * Get recommended routine for user
 */
router.get('/recommend/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const routine = await routineService.recommendRoutine(userId);
    res.json({
      success: true,
      data: routine,
    });
  } catch (error) {
    logger.error('Error recommending routine:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to recommend routine',
    });
  }
});

/**
 * POST /api/v1/routines/start
 * Start a new routine session
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { userId, routineTypeId, moodleQuizId, moodleAttemptId, triggerReason } = req.body;

    if (!userId || !routineTypeId) {
      return res.status(400).json({
        success: false,
        error: 'userId and routineTypeId are required',
      });
    }

    const record = await routineService.createRoutineRecord({
      userId,
      routineTypeId,
      moodleQuizId,
      moodleAttemptId,
      triggerReason: triggerReason || 'manual',
    });

    res.json({
      success: true,
      data: record,
    });
  } catch (error) {
    logger.error('Error starting routine:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start routine',
    });
  }
});

/**
 * POST /api/v1/routines/complete
 * Complete a routine session
 */
router.post('/complete', async (req: Request, res: Response) => {
  try {
    const { routineRecordId, rating, feedback, duration } = req.body;

    if (!routineRecordId) {
      return res.status(400).json({
        success: false,
        error: 'routineRecordId is required',
      });
    }

    const record = await routineService.completeRoutine({
      routineRecordId,
      rating,
      feedback,
      duration,
    });

    res.json({
      success: true,
      data: record,
    });
  } catch (error) {
    logger.error('Error completing routine:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete routine',
    });
  }
});

/**
 * GET /api/v1/routines/history/:userId
 * Get user's routine history
 */
router.get('/history/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const records = await routineService.getUserRoutineRecords(userId, limit);

    res.json({
      success: true,
      data: records,
    });
  } catch (error) {
    logger.error('Error fetching routine history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch routine history',
    });
  }
});

/**
 * GET /api/v1/routines/statistics/:userId
 * Get user's routine statistics
 */
router.get('/statistics/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const stats = await routineService.getUserStatistics(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error fetching routine statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch routine statistics',
    });
  }
});

export default router;
