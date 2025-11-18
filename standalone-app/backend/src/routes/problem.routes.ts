import { Router } from 'express';
import {
  getProblems,
  getProblem,
  createProblem,
  updateProblem,
  deleteProblem,
} from '../controllers/problem.controller';
import { authenticateToken, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Public routes
router.get('/', asyncHandler(getProblems));
router.get('/:id', asyncHandler(getProblem));

// Teacher/Admin routes
router.post(
  '/',
  authenticateToken,
  requireRole('teacher', 'admin'),
  asyncHandler(createProblem)
);

router.put(
  '/:id',
  authenticateToken,
  requireRole('teacher', 'admin'),
  asyncHandler(updateProblem)
);

router.delete(
  '/:id',
  authenticateToken,
  requireRole('teacher', 'admin'),
  asyncHandler(deleteProblem)
);

export default router;
