import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import * as argumentController from '../controllers/argumentController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.post('/', asyncHandler(argumentController.submitArgument));
router.get('/', asyncHandler(argumentController.getArguments));
router.get('/stats', asyncHandler(argumentController.getArgumentStats));
router.get('/:id', asyncHandler(argumentController.getArgumentById));
router.delete('/:id', asyncHandler(argumentController.deleteArgument));

export default router;
