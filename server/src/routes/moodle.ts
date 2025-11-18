import { Router, Request, Response, NextFunction } from 'express';
import { MoodleService } from '../services/moodleService';
import { createError } from '../middleware/errorHandler';

const router = Router();
const moodleService = new MoodleService();

/**
 * GET /api/moodle/questions/:courseId
 * Fetch questions from Moodle course
 */
router.get('/questions/:courseId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.params;
    const questions = await moodleService.getQuestions(parseInt(courseId));

    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/moodle/question/:questionId
 * Fetch specific question details
 */
router.get('/question/:questionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { questionId } = req.params;
    const question = await moodleService.getQuestionById(parseInt(questionId));

    if (!question) {
      throw createError('Question not found', 404);
    }

    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/moodle/auth
 * Authenticate with Moodle and create session
 */
router.post('/auth', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, token } = req.body;

    if (!token) {
      throw createError('Token is required', 400);
    }

    const session = await moodleService.authenticate(username, token);

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/moodle/user/:userId
 * Get Moodle user information
 */
router.get('/user/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const user = await moodleService.getUserInfo(parseInt(userId));

    if (!user) {
      throw createError('User not found', 404);
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

export default router;
