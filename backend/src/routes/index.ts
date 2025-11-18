import { Router } from 'express';
import problemRoutes from './problemRoutes';
import studentRoutes from './studentRoutes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'math-error-detection-api',
    version: '1.0.0',
  });
});

// API routes
router.use('/problems', problemRoutes);
router.use('/students', studentRoutes);

export default router;
