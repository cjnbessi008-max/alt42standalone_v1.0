import { Router } from 'express';
import { getDashboardStats } from '../controllers/analytics.controller';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/dashboard', asyncHandler(getDashboardStats));

export default router;
