/**
 * Teacher Routes
 */

import { Router } from 'express';
import { TeacherController } from '../controllers/teacherController';

const router = Router();

// Dashboard
router.get('/dashboard', TeacherController.getDashboard);
router.get('/analytics', TeacherController.getAnalytics);

// Student management
router.get('/students', TeacherController.getAllStudents);
router.get('/students/:id', TeacherController.getStudentDetail);

export default router;
