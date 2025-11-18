import { Router } from 'express';
import { body, query } from 'express-validator';
import problemController from '../controllers/problemController';
import { validate } from '../middleware/validation';

const router = Router();

/**
 * GET /api/v1/problems
 * Get all problems with optional filters
 */
router.get(
  '/',
  [
    query('type').optional().isString(),
    query('difficulty').optional().isIn(['easy', 'medium', 'hard']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  validate,
  problemController.getAllProblems
);

/**
 * GET /api/v1/problems/random
 * Get a random problem
 */
router.get('/random', problemController.getRandomProblem);

/**
 * GET /api/v1/problems/:id
 * Get problem by ID
 */
router.get('/:id', problemController.getProblemById);

/**
 * POST /api/v1/problems
 * Create a new problem (teacher only)
 */
router.post(
  '/',
  [
    body('type').isString().notEmpty(),
    body('difficulty').isIn(['easy', 'medium', 'hard']),
    body('problem_data').isObject(),
    body('correct_answer').isObject(),
    body('visual_type').optional().isString(),
    body('tags').optional().isArray(),
  ],
  validate,
  problemController.createProblem
);

/**
 * POST /api/v1/problems/:id/submit
 * Submit an answer for validation
 */
router.post(
  '/:id/submit',
  [
    body('student_answer').isObject(),
    body('student_answer.numerator').isInt(),
    body('student_answer.denominator').isInt(),
    body('time_spent_seconds').optional().isInt({ min: 0 }),
    body('student_id').optional().isString(), // Temporary until auth is implemented
  ],
  validate,
  problemController.submitAnswer
);

/**
 * GET /api/v1/problems/:id/submissions
 * Get submissions for a problem
 */
router.get('/:id/submissions', problemController.getProblemSubmissions);

export default router;
