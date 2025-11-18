import { Router } from 'express';
import { query } from 'express-validator';
import studentController from '../controllers/studentController';
import { validate } from '../middleware/validation';

const router = Router();

/**
 * GET /api/v1/students/:studentId/progress
 * Get student progress by problem type
 */
router.get('/:studentId/progress', studentController.getProgress);

/**
 * GET /api/v1/students/:studentId/submissions
 * Get student submissions
 */
router.get(
  '/:studentId/submissions',
  [
    query('problem_id').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  validate,
  studentController.getSubmissions
);

/**
 * GET /api/v1/students/:studentId/errors
 * Get error patterns for a student
 */
router.get('/:studentId/errors', studentController.getErrorPatterns);

/**
 * GET /api/v1/students/:studentId/error-stats
 * Get error statistics
 */
router.get('/:studentId/error-stats', studentController.getErrorStats);

/**
 * GET /api/v1/students/:studentId/summary
 * Get performance summary
 */
router.get('/:studentId/summary', studentController.getPerformanceSummary);

export default router;
