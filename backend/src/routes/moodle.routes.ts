import { Router, Request, Response, NextFunction } from 'express';
import moodleService from '../services/moodle.service';
import problemService from '../services/problem.service';
import treeService from '../services/tree.service';
import { createError } from '../middleware/errorHandler';
import { ApiResponse, ProblemType } from '../types';

const router = Router();

/**
 * GET /api/moodle/test
 * Test Moodle connection
 */
router.get('/test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const connected = await moodleService.testConnection();

    const response: ApiResponse = {
      success: connected,
      data: {
        connected,
        message: connected ? 'Moodle connection successful' : 'Moodle connection failed'
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/moodle/quizzes/:courseId
 * Get quizzes by course ID
 */
router.get('/quizzes/:courseId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courseId = parseInt(req.params.courseId);
    if (isNaN(courseId)) {
      throw createError('Invalid course ID', 400);
    }

    const quizzes = await moodleService.getQuizzesByCourse(courseId);

    const response: ApiResponse = {
      success: true,
      data: quizzes,
      meta: {
        timestamp: new Date().toISOString(),
        count: quizzes.length
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/moodle/quiz/:quizId
 * Get quiz by ID
 */
router.get('/quiz/:quizId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quizId = parseInt(req.params.quizId);
    if (isNaN(quizId)) {
      throw createError('Invalid quiz ID', 400);
    }

    const quiz = await moodleService.getQuizById(quizId);
    if (!quiz) {
      throw createError('Quiz not found', 404);
    }

    const response: ApiResponse = {
      success: true,
      data: quiz,
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/moodle/sync/:quizId
 * Sync quiz from Moodle and create/update problem
 */
router.post('/sync/:quizId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quizId = parseInt(req.params.quizId);
    if (isNaN(quizId)) {
      throw createError('Invalid quiz ID', 400);
    }

    // Get quiz from Moodle
    const quiz = await moodleService.getQuizById(quizId);
    if (!quiz) {
      throw createError('Quiz not found in Moodle', 404);
    }

    // Parse tree configuration from quiz description
    const treeConfig = moodleService.parseTreeConfigFromQuiz(quiz);
    if (!treeConfig) {
      throw createError('No valid tree configuration found in quiz description', 400);
    }

    // Check if problem already exists
    let problem = await problemService.getProblemByMoodleQuizId(quizId);

    if (problem) {
      // Update existing problem
      problem = await problemService.updateProblem(problem.id, {
        title: quiz.name,
        description: quiz.intro,
        tree_config: treeConfig
      });
    } else {
      // Create new problem
      problem = await problemService.createProblem({
        moodle_quiz_id: quizId,
        title: quiz.name,
        description: quiz.intro,
        tree_config: treeConfig,
        problem_type: treeConfig.type as ProblemType || ProblemType.PROBABILITY_TREE,
        difficulty_level: 1
      });
    }

    // Generate tree nodes
    if (problem) {
      const nodes = treeService.generateTreeNodes(treeConfig, problem.id);
      await problemService.saveTreeNodes(nodes);
    }

    const response: ApiResponse = {
      success: true,
      data: {
        problem,
        quiz: {
          id: quiz.id,
          name: quiz.name
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        action: problem ? 'updated' : 'created'
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/moodle/user/:userId/attempts/:quizId
 * Get user attempts for a quiz
 */
router.get('/user/:userId/attempts/:quizId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.params.userId);
    const quizId = parseInt(req.params.quizId);

    if (isNaN(userId) || isNaN(quizId)) {
      throw createError('Invalid user ID or quiz ID', 400);
    }

    const attempts = await moodleService.getUserAttempts(quizId, userId);

    const response: ApiResponse = {
      success: true,
      data: attempts,
      meta: {
        timestamp: new Date().toISOString(),
        count: attempts.length
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
