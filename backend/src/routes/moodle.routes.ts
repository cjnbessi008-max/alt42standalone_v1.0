import { Router, Request, Response } from 'express';
import moodleService from '../services/moodle.service';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/v1/moodle/user/:userId
 * Get Moodle user information
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const user = await moodleService.getUser(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Error fetching Moodle user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Moodle user',
    });
  }
});

/**
 * GET /api/v1/moodle/attempts/recent
 * Get recent quiz attempts
 */
router.get('/attempts/recent', async (req: Request, res: Response) => {
  try {
    const afterTimestamp = req.query.after ? parseInt(req.query.after as string) : 0;
    const attempts = await moodleService.getRecentQuizAttempts(afterTimestamp);

    res.json({
      success: true,
      data: attempts,
    });
  } catch (error) {
    logger.error('Error fetching recent quiz attempts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent quiz attempts',
    });
  }
});

/**
 * GET /api/v1/moodle/attempt/:attemptId/analyze
 * Analyze a quiz attempt
 */
router.get('/attempt/:attemptId/analyze', async (req: Request, res: Response) => {
  try {
    const attemptId = parseInt(req.params.attemptId);
    const result = await moodleService.analyzeQuizAttempt(attemptId);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Attempt not found',
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error analyzing quiz attempt:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze quiz attempt',
    });
  }
});

/**
 * GET /api/v1/moodle/user/:userId/streak
 * Get user's correct answer streak
 */
router.get('/user/:userId/streak', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const streak = await moodleService.getUserCorrectStreak(userId, limit);

    res.json({
      success: true,
      data: {
        userId,
        streak,
      },
    });
  } catch (error) {
    logger.error('Error fetching user streak:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user streak',
    });
  }
});

/**
 * GET /api/v1/moodle/quiz/:quizId
 * Get quiz information
 */
router.get('/quiz/:quizId', async (req: Request, res: Response) => {
  try {
    const quizId = parseInt(req.params.quizId);
    const quiz = await moodleService.getQuiz(quizId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found',
      });
    }

    res.json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    logger.error('Error fetching quiz:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quiz',
    });
  }
});

export default router;
