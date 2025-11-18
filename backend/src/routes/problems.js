import express from 'express';
import { body, param, validationResult } from 'express-validator';
import * as Problem from '../models/problem.js';

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * POST /api/problems
 * Create or update problem
 */
router.post(
  '/',
  [
    body('problem_id').notEmpty().withMessage('Problem ID is required'),
    body('module_id').notEmpty().withMessage('Module ID is required'),
    body('title').notEmpty().withMessage('Title is required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { problem_id, module_id, title, description, difficulty_level, problem_type } = req.body;
      const problem = await Problem.upsertProblem(
        problem_id,
        module_id,
        title,
        description,
        difficulty_level,
        problem_type
      );

      res.json({
        success: true,
        data: problem
      });
    } catch (error) {
      console.error('Error upserting problem:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * GET /api/problems/:problem_id
 * Get problem by ID
 */
router.get(
  '/:problem_id',
  [
    param('problem_id').notEmpty().withMessage('Problem ID is required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { problem_id } = req.params;
      const problem = await Problem.getProblem(problem_id);

      if (!problem) {
        return res.status(404).json({
          success: false,
          error: 'Problem not found'
        });
      }

      res.json({
        success: true,
        data: problem
      });
    } catch (error) {
      console.error('Error fetching problem:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

/**
 * GET /api/problems
 * Get all problems or by module
 */
router.get('/', async (req, res) => {
  try {
    const { module_id } = req.query;

    const problems = module_id
      ? await Problem.getProblemsByModule(module_id)
      : await Problem.getAllProblems();

    res.json({
      success: true,
      data: problems
    });
  } catch (error) {
    console.error('Error fetching problems:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
