import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import moodleService from '../services/moodle.service';

const router = Router();

/**
 * Health check endpoint
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Check PostgreSQL connection
    await prisma.$queryRaw`SELECT 1`;

    // Check Moodle MySQL connection
    const moodleConnected = await moodleService.testConnection();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        api: 'running',
        postgresql: 'connected',
        moodleMySQL: moodleConnected ? 'connected' : 'disconnected',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
