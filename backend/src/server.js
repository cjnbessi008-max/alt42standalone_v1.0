/**
 * Unfolding Net Live - Backend Server
 * Express.js API server for Moodle LMS integration
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';
import { testConnection } from './config/database.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Unfolding Net Live API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      problems: '/api/problems?courseId=X&moduleId=Y',
      courseProblems: '/api/courses/:courseId/problems',
      createProblem: 'POST /api/problems',
      saveProgress: 'POST /api/progress',
      login: 'POST /api/auth/login',
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    timestamp: Date.now(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    timestamp: Date.now(),
  });
});

// Start server
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.warn('⚠ Database not connected - using dummy data');
    }

    app.listen(PORT, () => {
      console.log('');
      console.log('╔═══════════════════════════════════════════╗');
      console.log('║   Unfolding Net Live - Backend Server    ║');
      console.log('╚═══════════════════════════════════════════╝');
      console.log('');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
      console.log(`🔒 CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
      console.log(`💾 Database: ${dbConnected ? 'Connected' : 'Disconnected (using dummy data)'}`);
      console.log('');
      console.log('Press Ctrl+C to stop');
      console.log('');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});

startServer();

export default app;
