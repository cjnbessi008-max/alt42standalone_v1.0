import { Router } from 'express';
import { authenticateToken, authorize } from '../middleware/auth';
import { UserRole } from '../models';
import * as ErrorReasonController from '../controllers/ErrorReasonController';
import * as PatternAnalysisController from '../controllers/PatternAnalysisController';
import * as CategoryController from '../controllers/CategoryController';

const router = Router();

// All routes require authentication as student
router.use(authenticateToken);
router.use(authorize(UserRole.STUDENT));

// Error Reasons
router.post('/errors/:id/reason', ErrorReasonController.createErrorReason);
router.get('/errors/reasons', ErrorReasonController.getMyErrorReasons);
router.get('/errors/reasons/:id', ErrorReasonController.getErrorReasonById);
router.put('/errors/reasons/:id', ErrorReasonController.updateErrorReason);
router.delete('/errors/reasons/:id', ErrorReasonController.deleteErrorReason);

// Statistics
router.get('/errors/stats', ErrorReasonController.getMyErrorStats);

// Pattern Analysis
router.get('/my-patterns', PatternAnalysisController.getMyPattern);

// Categories
router.get('/categories', CategoryController.getAllCategories);

export default router;
