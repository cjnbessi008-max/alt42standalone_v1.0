/**
 * Focus Mode API Server
 * Express server for focus session tracking
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { createFocusSessionRoutes } from './routes/focusSessionRoutes';

// Environment configuration
const PORT = process.env.PORT || 3001;
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/focus_mode_db';

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.stack);
    process.exit(1);
  } else {
    console.log('✅ Database connection established');
    release();
  }
});

// Create Express app
const app: Application = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// API info endpoint
app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'Focus Mode API',
    version: '1.0.0',
    description: 'API for tracking focus sessions with eye blink detection',
    endpoints: {
      sessions: {
        create: 'POST /api/focus-sessions',
        get: 'GET /api/focus-sessions/:sessionId',
        updateMetrics: 'PUT /api/focus-sessions/:sessionId/metrics',
        end: 'PUT /api/focus-sessions/:sessionId/end',
      },
      users: {
        sessions: 'GET /api/focus-sessions/user/:userId',
        stats: 'GET /api/focus-sessions/user/:userId/stats',
      },
      courses: {
        analytics: 'GET /api/focus-sessions/course/:courseId/analytics',
      },
      leaderboard: 'GET /api/focus-sessions/leaderboard',
    },
  });
});

// Mount routes
app.use('/api', createFocusSessionRoutes(pool));

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
    timestamp: new Date().toISOString(),
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`
🚀 Focus Mode API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Server running on: http://localhost:${PORT}
🗄️  Database: ${DATABASE_URL.split('@')[1] || 'PostgreSQL'}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📡 CORS enabled for: ${process.env.CORS_ORIGIN || '*'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

API Documentation: http://localhost:${PORT}/api
Health Check: http://localhost:${PORT}/health
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});

export { app, pool };
