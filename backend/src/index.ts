import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import logger from './utils/logger';
import db from './config/database';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;
const API_VERSION = process.env.API_VERSION || 'v1';

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Middleware
app.use(helmet()); // Security headers
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    query: req.query,
    ip: req.ip,
  });
  next();
});

// Routes
app.use(`/api/${API_VERSION}`, routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Math Calculation Error Detection API',
    version: '1.0.0',
    endpoints: {
      health: `/api/${API_VERSION}/health`,
      problems: `/api/${API_VERSION}/problems`,
      students: `/api/${API_VERSION}/students`,
    },
    documentation: '/api/docs', // TODO: Add Swagger docs
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Database connection test and server start
const startServer = async () => {
  try {
    // Test database connection
    await db.query('SELECT NOW()');
    logger.info('✓ Database connection established');

    // Start server
    app.listen(PORT, () => {
      logger.info(`✓ Server running on port ${PORT}`);
      logger.info(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`✓ API Version: ${API_VERSION}`);
      logger.info(`✓ API Base URL: http://localhost:${PORT}/api/${API_VERSION}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await db.end();
  process.exit(0);
});

startServer();

export default app;
