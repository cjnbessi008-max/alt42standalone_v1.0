/**
 * Grading Routes
 */

import { Router } from 'express';
import gradingController from '../controllers/gradingController';

const router = Router();

/**
 * POST /api/grading/submit
 * Submit student answer for grading
 */
router.post('/submit', (req, res) => gradingController.submitAnswer(req, res));

/**
 * GET /api/grading/:studentId/module/:moduleId
 * Get all grading results for a student in a module
 */
router.get('/:studentId/module/:moduleId', (req, res) =>
  gradingController.getGradingResults(req, res)
);

/**
 * GET /api/progress/:studentId/module/:moduleId
 * Get module progress for a student
 */
router.get('/progress/:studentId/module/:moduleId', (req, res) =>
  gradingController.getModuleProgress(req, res)
);

export default router;
