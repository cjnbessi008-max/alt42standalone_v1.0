import { Router } from 'express';
import emotionRoutes from './emotionRoutes';
import sessionRoutes from './sessionRoutes';
import summaryRoutes from './summaryRoutes';
import lmsRoutes from './lmsRoutes';

const router = Router();

router.use('/emotions', emotionRoutes);
router.use('/sessions', sessionRoutes);
router.use('/summaries', summaryRoutes);
router.use('/lms', lmsRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'emotion-tracking-api',
  });
});

export default router;
