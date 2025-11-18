import { Router, Request, Response } from 'express';
import { param, query, validationResult } from 'express-validator';
import databaseService from '../services/database.service';

const router = Router();

/**
 * GET /api/problems
 * 모든 문제 조회 (쿼리 파라미터로 필터링 가능)
 */
router.get(
  '/',
  [
    query('difficulty')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Difficulty must be between 1 and 5'),
    query('category')
      .optional()
      .isString()
      .withMessage('Category must be a string'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { difficulty, category } = req.query;

      let problems;

      if (difficulty) {
        problems = await databaseService.getProblemsByDifficulty(
          parseInt(difficulty as string)
        );
      } else if (category) {
        problems = await databaseService.getProblemsByCategory(category as string);
      } else {
        problems = await databaseService.getAllProblems();
      }

      res.json({
        success: true,
        count: problems.length,
        data: problems,
      });
    } catch (error) {
      console.error('Error fetching problems:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch problems',
      });
    }
  }
);

/**
 * GET /api/problems/:id
 * 특정 문제 조회
 */
router.get(
  '/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid problem ID'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const problem = await databaseService.getProblemById(id);

      res.json({
        success: true,
        data: problem,
      });
    } catch (error) {
      console.error('Error fetching problem:', error);
      res.status(404).json({
        success: false,
        error: error instanceof Error ? error.message : 'Problem not found',
      });
    }
  }
);

/**
 * GET /api/problems/categories/list
 * 모든 카테고리 목록 조회
 */
router.get('/categories/list', async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT DISTINCT category
      FROM problems
      WHERE category IS NOT NULL
      ORDER BY category
    `;

    const { pool } = require('../index');
    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows.map((row: any) => row.category),
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
    });
  }
});

export default router;
