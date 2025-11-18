import { Router } from 'express';
import { getUserStats, getOverallStats } from '../controllers/stats.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/user/:userId', authenticate, getUserStats);
router.get('/overall', authenticate, authorize('ADMIN', 'TEACHER'), getOverallStats);

export default router;
