/**
 * 문제 관리 라우트
 * 닮음 문제 제공 및 답안 검증
 */

import { Router, Request, Response } from 'express';
import { problemService } from '../services/problemService.js';

const router = Router();

/**
 * GET /api/problems
 * 문제 목록 가져오기
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const problems = await problemService.getProblems();

    res.json({
      success: true,
      data: problems,
    });
  } catch (error) {
    console.error('Failed to fetch problems:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch problems',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/problems/:id
 * 특정 문제 가져오기
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const problemId = req.params.id;
    const problem = await problemService.getProblem(problemId);

    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found',
      });
    }

    res.json({
      success: true,
      data: problem,
    });
  } catch (error) {
    console.error('Failed to fetch problem:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch problem',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/problems/:id/submit
 * 답안 제출 및 검증
 */
router.post('/:id/submit', async (req: Request, res: Response) => {
  try {
    const problemId = req.params.id;
    const { selectedCondition, calculatedRatio } = req.body;

    const result = await problemService.checkAnswer(
      problemId,
      selectedCondition,
      calculatedRatio
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Failed to check answer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check answer',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as problemRoutes };
