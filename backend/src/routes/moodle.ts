import { Router, Request, Response } from 'express';
import { MoodleService } from '../services/moodleService';
import { ApiResponse } from '../types';

const router = Router();
const moodleService = new MoodleService();

/**
 * GET /api/moodle/question/:id
 * Fetch and parse a question from Moodle
 */
router.get('/question/:id', async (req: Request, res: Response) => {
  try {
    const questionId = parseInt(req.params.id);

    if (isNaN(questionId)) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid question ID',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    // Fetch from Moodle
    const moodleQuestion = await moodleService.getQuestion(questionId);

    if (!moodleQuestion) {
      const response: ApiResponse = {
        success: false,
        error: 'Question not found',
        timestamp: new Date().toISOString(),
      };
      return res.status(404).json(response);
    }

    // Parse to structured format
    const parsedProblem = moodleService.parseQuestion(moodleQuestion);

    const response: ApiResponse = {
      success: true,
      data: parsedProblem,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error('Error in /api/moodle/question/:id:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/moodle/quiz/:id/questions
 * Fetch all questions from a quiz
 */
router.get('/quiz/:id/questions', async (req: Request, res: Response) => {
  try {
    const quizId = parseInt(req.params.id);

    if (isNaN(quizId)) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid quiz ID',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const questions = await moodleService.getQuizQuestions(quizId);
    const parsedProblems = questions.map(q => moodleService.parseQuestion(q));

    const response: ApiResponse = {
      success: true,
      data: parsedProblems,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error('Error in /api/moodle/quiz/:id/questions:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/moodle/test
 * Test Moodle connection
 */
router.get('/test', async (req: Request, res: Response) => {
  try {
    const isConnected = await moodleService.testConnection();

    const response: ApiResponse = {
      success: isConnected,
      data: {
        connected: isConnected,
        moodleUrl: process.env.MOODLE_URL,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error('Error in /api/moodle/test:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

export default router;
