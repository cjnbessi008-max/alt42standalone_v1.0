import { Router } from 'express';
import { ProblemController } from '../controllers/problem.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Teacher-only routes
router.post('/', authorize('TEACHER', 'ADMIN'), ProblemController.createProblem);
router.put('/:id', authorize('TEACHER', 'ADMIN'), ProblemController.updateProblem);
router.delete('/:id', authorize('TEACHER', 'ADMIN'), ProblemController.deleteProblem);
router.get('/stats', authorize('TEACHER', 'ADMIN'), ProblemController.getTeacherStats);

// Shared routes
router.get('/', ProblemController.getProblems);
router.get('/:id', ProblemController.getProblemById);

export default router;
