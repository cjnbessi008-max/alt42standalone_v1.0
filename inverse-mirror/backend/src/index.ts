import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { testConnection } from './config/database.js';
import moodleService from './services/moodleService.js';
import problemRoutes from './routes/problemRoutes.js';
import progressRoutes from './routes/progressRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/problems', problemRoutes);
app.use('/api/progress', progressRoutes);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Inverse Mirror API',
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Inverse Mirror API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      problems: '/api/problems',
      progress: '/api/progress',
    },
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
const startServer = async () => {
  try {
    console.log('🚀 Starting Inverse Mirror API Server...');

    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.warn('⚠️  Database connection failed - running in demo mode');
    }

    // Test Moodle connection
    const moodleConnected = await moodleService.testConnection();
    if (!moodleConnected) {
      console.warn('⚠️  Moodle connection failed - using sample problems');
    }

    // Start listening
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Database: ${dbConnected ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`   Moodle: ${moodleConnected ? '✅ Connected' : '❌ Disconnected'}`);
      console.log('\n📚 API Documentation:');
      console.log(`   GET  /api/health`);
      console.log(`   GET  /api/problems`);
      console.log(`   GET  /api/problems/random`);
      console.log(`   GET  /api/problems/:id`);
      console.log(`   POST /api/problems`);
      console.log(`   GET  /api/problems/moodle/:quizId`);
      console.log(`   POST /api/progress`);
      console.log(`   GET  /api/progress/:studentId`);
      console.log(`   GET  /api/progress/:studentId/:problemId`);
      console.log(`   GET  /api/progress/:studentId/stats`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();
