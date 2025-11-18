import { Router } from 'express';
import { getUsers, getLeaderboard } from '../controllers/user.controller';
import { authenticateToken, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Public routes
router.get('/leaderboard', asyncHandler(getLeaderboard));

// Admin routes
router.get(
  '/',
  authenticateToken,
  requireRole('admin'),
  asyncHandler(getUsers)
);

export default router;
