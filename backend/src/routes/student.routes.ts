import { Router } from 'express';
import { StudentController } from '../controllers/student.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication as student
router.use(authenticate);
router.use(authorize('STUDENT', 'ADMIN'));

router.get('/stories', StudentController.getAvailableStories);
router.post('/stories/start', StudentController.startStory);
router.post('/stories/:storyId/complete', StudentController.completeStory);
router.get('/progress', StudentController.getProgress);
router.get('/analytics', StudentController.getAnalytics);
router.get('/stories/:storyId/progress', StudentController.getStoryProgress);

export default router;
