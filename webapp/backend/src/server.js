/**
 * Express Server for Concept-Problem Matching System
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';

// Routes
import conceptsRouter from './routes/concepts.js';
import problemsRouter from './routes/problems.js';
import studentsRouter from './routes/students.js';
import progressRouter from './routes/progress.js';
import recommendationsRouter from './routes/recommendations.js';
import graphRouter from './routes/graph.js';
import analyticsRouter from './routes/analytics.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3001;
const DB_PATH = process.env.DB_PATH || join(__dirname, '../data/concepts.db');

// Initialize Express app
const app = express();

// Initialize database connection
export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log(`📊 Database connected: ${DB_PATH}`);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: db.open ? 'connected' : 'disconnected'
  });
});

// API Routes
app.use('/api/concepts', conceptsRouter);
app.use('/api/problems', problemsRouter);
app.use('/api/students', studentsRouter);
app.use('/api/progress', progressRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/graph', graphRouter);
app.use('/api/analytics', analyticsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`\n📡 API endpoints:`);
  console.log(`   GET  /health`);
  console.log(`   GET  /api/concepts`);
  console.log(`   GET  /api/problems`);
  console.log(`   GET  /api/students`);
  console.log(`   GET  /api/recommendations/:studentId`);
  console.log(`   GET  /api/graph`);
  console.log(`   GET  /api/analytics/:studentId`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing database connection...');
  db.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, closing database connection...');
  db.close();
  process.exit(0);
});
