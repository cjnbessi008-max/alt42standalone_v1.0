import { Router } from 'express';
import problemRoutes from './problemRoutes';
import progressRoutes from './progressRoutes';
import moodleRoutes from './moodleRoutes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  });
});

// Routes
router.use('/problems', problemRoutes);
router.use('/progress', progressRoutes);
router.use('/moodle', moodleRoutes);

export default router;
