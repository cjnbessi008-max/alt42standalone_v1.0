import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
} from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes
router.post('/register', authLimiter, asyncHandler(register));
router.post('/login', authLimiter, asyncHandler(login));

// Protected routes
router.get('/profile', authenticateToken, asyncHandler(getProfile));
router.put('/profile', authenticateToken, asyncHandler(updateProfile));

export default router;
