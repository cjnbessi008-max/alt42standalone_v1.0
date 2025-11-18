import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';
import sessionRoutes from './routes/sessionRoutes.js';
import movementRoutes from './routes/movementRoutes.js';
import moodleRoutes from './routes/moodleRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/sessions', sessionRoutes);
app.use('/api/movement', movementRoutes);
app.use('/api/moodle', moodleRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Mean Center API',
    version: '1.0.0',
    description: 'Backend API for Mean Center LMS Integration',
    endpoints: {
      sessions: '/api/sessions',
      movement: '/api/movement',
      moodle: '/api/moodle',
      health: '/health'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('⚠️  Warning: Database connection failed. Server will start but database operations will fail.');
    }

    app.listen(PORT, () => {
      console.log('');
      console.log('════════════════════════════════════════════════════════');
      console.log('  🚀 Mean Center API Server');
      console.log('════════════════════════════════════════════════════════');
      console.log(`  📍 Server running on: http://localhost:${PORT}`);
      console.log(`  🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  🔗 CORS origin: ${CORS_ORIGIN}`);
      console.log(`  💾 Database: ${dbConnected ? '✅ Connected' : '❌ Not connected'}`);
      console.log('════════════════════════════════════════════════════════');
      console.log('');
      console.log('Available endpoints:');
      console.log('  GET  /health');
      console.log('  GET  /api/sessions');
      console.log('  POST /api/sessions');
      console.log('  POST /api/movement');
      console.log('  GET  /api/movement/:sessionId');
      console.log('  GET  /api/mean-center/:sessionId');
      console.log('  POST /api/moodle/auth');
      console.log('  GET  /api/moodle/test');
      console.log('');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️  Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⏹️  Shutting down server...');
  process.exit(0);
});

startServer();

export default app;
