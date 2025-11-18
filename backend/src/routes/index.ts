import { Router } from 'express';
import authRoutes from './auth.routes';
import problemRoutes from './problem.routes';
import storyRoutes from './story.routes';
import studentRoutes from './student.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/problems', problemRoutes);
router.use('/stories', storyRoutes);
router.use('/student', studentRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    },
  });
});

export default router;
