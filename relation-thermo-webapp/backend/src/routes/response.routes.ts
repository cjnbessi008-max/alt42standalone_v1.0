import { Router } from 'express';
import {
  submitResponse,
  getUserResponses,
  getResponseById,
} from '../controllers/response.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, submitResponse);
router.get('/user/:userId', authenticate, getUserResponses);
router.get('/:id', authenticate, getResponseById);

export default router;
