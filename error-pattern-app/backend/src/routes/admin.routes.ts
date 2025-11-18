import { Router } from 'express';
import { authenticateToken, authorize } from '../middleware/auth';
import { UserRole } from '../models';
import * as CategoryController from '../controllers/CategoryController';

const router = Router();

// All routes require authentication as admin
router.use(authenticateToken);
router.use(authorize(UserRole.ADMIN));

// Category Management
router.get('/categories', CategoryController.getAllCategories);
router.post('/categories', CategoryController.createCategory);
router.put('/categories/:id', CategoryController.updateCategory);

export default router;
