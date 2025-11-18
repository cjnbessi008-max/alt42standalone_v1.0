import { Router } from 'express';
import { authenticateToken, authorize } from '../middleware/auth';
import { UserRole } from '../models';
import * as PatternAnalysisController from '../controllers/PatternAnalysisController';

const router = Router();

// All routes require authentication as teacher
router.use(authenticateToken);
router.use(authorize(UserRole.TEACHER, UserRole.ADMIN));

// Pattern Analysis
router.get(
  '/students/:studentId/patterns',
  PatternAnalysisController.getStudentPattern
);
router.post('/students/compare', PatternAnalysisController.compareStudents);

export default router;
