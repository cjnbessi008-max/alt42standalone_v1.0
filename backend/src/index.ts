/**
 * LMS Wrong Answer Analysis - Backend API Gateway
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { initializeMoodleClient } from './moodle/client';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Initialize PostgreSQL connection
export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

db.on('error', (err) => {
  logger.error('Unexpected error on idle database client', err);
  process.exit(-1);
});

// Initialize Moodle client
if (process.env.MOODLE_URL && process.env.MOODLE_TOKEN) {
  initializeMoodleClient({
    url: process.env.MOODLE_URL,
    token: process.env.MOODLE_TOKEN,
  });
  logger.info('Moodle client initialized');
} else {
  logger.warn('Moodle credentials not configured. Set MOODLE_URL and MOODLE_TOKEN in .env');
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
    });
  }
});

// API Routes
app.get('/api', (req, res) => {
  res.json({
    name: 'LMS Wrong Answer Analysis API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      sync: '/api/sync/*',
      analysis: '/api/analysis/*',
      confidence: '/api/confidence/*',
      recommendations: '/api/recommendations/*',
    },
  });
});

// Import routes
import syncRoutes from './routes/sync';
import analysisRoutes from './routes/analysis';
import confidenceRoutes from './routes/confidence';

app.use('/api/sync', syncRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/confidence', confidenceRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Endpoint not found',
      path: req.path,
    },
  });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    db.end(() => {
      logger.info('Database pool closed');
      process.exit(0);
    });
  });
});

export default app;
