import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import * as progressController from '../controllers/progressController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', asyncHandler(progressController.getProgress));
router.get('/stats', asyncHandler(progressController.getDetailedStats));
router.post('/update', asyncHandler(progressController.updateProgress));
router.get('/leaderboard', asyncHandler(progressController.getLeaderboard));

export default router;
