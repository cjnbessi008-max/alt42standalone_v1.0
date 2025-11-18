import { Router } from 'express';
import { StoryController } from '../controllers/story.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Teacher-only routes
router.post('/generate', authorize('TEACHER', 'ADMIN'), StoryController.generateStory);
router.put('/:id/regenerate', authorize('TEACHER', 'ADMIN'), StoryController.regenerateStory);
router.delete('/:id', authorize('TEACHER', 'ADMIN'), StoryController.deleteStory);

// Shared routes
router.get('/', StoryController.getStories);
router.get('/:id', StoryController.getStoryById);
router.get('/problem/:problemId', StoryController.getStoriesByProblem);

export default router;
