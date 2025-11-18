import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { connectRedis } from './config/redis';
import { startDailySummaryJob } from './jobs/dailySummaryJob';
import { startLMSSyncJob } from './jobs/lmsSyncJob';
import logger from './utils/logger';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4000;
const API_VERSION = process.env.API_VERSION || 'v1';

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// API Routes
app.use(`/api/${API_VERSION}`, routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'LMS Emotion Tracking API',
    version: API_VERSION,
    status: 'running',
    endpoints: {
      health: `/api/${API_VERSION}/health`,
      emotions: `/api/${API_VERSION}/emotions`,
      sessions: `/api/${API_VERSION}/sessions`,
      summaries: `/api/${API_VERSION}/summaries`,
      lms: `/api/${API_VERSION}/lms`,
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to Redis
    await connectRedis();
    logger.info('✅ Redis connected');

    // Start cron jobs
    startDailySummaryJob();
    startLMSSyncJob();
    logger.info('✅ Cron jobs started');

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📍 API endpoint: http://localhost:${PORT}/api/${API_VERSION}`);
      logger.info(`🏥 Health check: http://localhost:${PORT}/api/${API_VERSION}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
