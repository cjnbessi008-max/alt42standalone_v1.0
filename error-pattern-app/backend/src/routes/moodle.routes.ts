import { Router } from 'express';
import { authenticateToken, authorize } from '../middleware/auth';
import { UserRole } from '../models';
import * as MoodleController from '../controllers/MoodleController';

const router = Router();

router.use(authenticateToken);

// Student routes
router.get(
  '/pending-errors',
  authorize(UserRole.STUDENT),
  MoodleController.getPendingErrors
);

// Admin routes
router.post(
  '/sync/users',
  authorize(UserRole.ADMIN),
  MoodleController.syncUsers
);

router.post(
  '/sync/quiz-attempts',
  authorize(UserRole.ADMIN),
  MoodleController.syncQuizAttempts
);

router.post('/sync/all', authorize(UserRole.ADMIN), MoodleController.syncAll);

export default router;
