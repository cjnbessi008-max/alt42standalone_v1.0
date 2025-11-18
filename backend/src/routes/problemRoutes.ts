import { Router, Request, Response } from 'express';
import databaseService from '../services/databaseService';
import { ApiResponse, QuizProblem } from '../types';

const router = Router();

/**
 * GET /api/problem/:problemId
 * Get specific problem with trap points
 */
router.get('/:problemId', async (req: Request, res: Response) => {
  try {
    const problemId = parseInt(req.params.problemId);

    if (isNaN(problemId)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid problem ID',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    // Get question
    const question = await databaseService.getQuestion(problemId);

    if (!question) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Problem not found',
        timestamp: new Date().toISOString(),
      };
      return res.status(404).json(response);
    }

    // Get answers and trap points
    const answers = await databaseService.getQuestionAnswers(problemId);
    const trapPoints = await databaseService.getTrapPoints(problemId);

    const problem: QuizProblem = {
      question,
      answers,
      trapPoints,
    };

    const response: ApiResponse<QuizProblem> = {
      success: true,
      data: problem,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error('Error in GET /api/problem/:problemId:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

export default router;
