import { Router } from 'express';
import {
  getProblems,
  getProblemById,
  createProblem,
  updateProblem,
  deleteProblem,
} from '../controllers/problem.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getProblems);
router.get('/:id', authenticate, getProblemById);
router.post('/', authenticate, authorize('ADMIN', 'TEACHER'), createProblem);
router.put('/:id', authenticate, authorize('ADMIN', 'TEACHER'), updateProblem);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteProblem);

export default router;
