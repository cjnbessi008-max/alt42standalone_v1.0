import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import * as authController from '../controllers/authController';

const router = Router();

// Public routes
router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));

// Protected routes
router.get('/profile', authenticateToken, asyncHandler(authController.getProfile));
router.put('/profile', authenticateToken, asyncHandler(authController.updateProfile));
router.post('/change-password', authenticateToken, asyncHandler(authController.changePassword));

export default router;
