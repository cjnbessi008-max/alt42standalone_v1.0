import express from 'express';
import sequelize from '../config/database.js';
import redisClient from '../config/redis.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // Check database
    await sequelize.authenticate();

    // Check Redis
    await redisClient.ping();

    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected'
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

export default router;
