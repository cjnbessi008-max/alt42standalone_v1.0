import { Router } from 'express';
import {
  submitAttempt,
  getAttempts,
  getAttempt,
  getMyAttempts,
} from '../controllers/attempt.controller';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { submissionLimiter } from '../middleware/rateLimiter';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Submit attempt
router.post('/problem/:problemId', submissionLimiter, asyncHandler(submitAttempt));

// Get attempts for a problem
router.get('/problem/:problemId', asyncHandler(getAttempts));

// Get single attempt
router.get('/:id', asyncHandler(getAttempt));

// Get all my attempts
router.get('/', asyncHandler(getMyAttempts));

export default router;
