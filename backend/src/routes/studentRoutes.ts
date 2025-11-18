/**
 * Student Routes
 */

import { Router } from 'express';
import { StudentController } from '../controllers/studentController';

const router = Router();

// Student profile and progress
router.get('/:id', StudentController.getProfile);
router.get('/:id/progress', StudentController.getProgress);

// Problem solving
router.get('/:id/next-problem', StudentController.getNextProblem);
router.post('/:id/submit', StudentController.submitAnswer);

export default router;
