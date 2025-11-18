import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { testConnection } from './config/database';
import { validateMoodleConfig } from './config/moodle';
import moodleService from './services/moodleService';
import quizRoutes from './routes/quizRoutes';
import problemRoutes from './routes/problemRoutes';
import trapPointRoutes from './routes/trapPointRoutes';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Response compression
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ALT42 Trap Shadow Backend',
  });
});

// API Routes
app.use('/api/quiz', quizRoutes);
app.use('/api/problem', problemRoutes);
app.use('/api/trap-points', trapPointRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString(),
  });
});

// Start server
async function startServer() {
  try {
    console.log('🚀 Starting ALT42 Trap Shadow Backend...\n');

    // Validate configurations
    console.log('📋 Validating configurations...');
    const moodleValid = validateMoodleConfig();

    if (!moodleValid) {
      console.error('⚠️  Moodle configuration invalid. Some features may not work.');
    }

    // Test database connection
    console.log('\n🔌 Testing database connection...');
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('⚠️  Database connection failed. Some features may not work.');
    }

    // Test Moodle connection
    if (moodleValid) {
      console.log('\n🌐 Testing Moodle connection...');
      await moodleService.validateConnection();
    }

    // Start listening
    app.listen(PORT, () => {
      console.log('\n✅ Server started successfully!');
      console.log(`📡 Listening on port ${PORT}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log('\n📚 Available endpoints:');
      console.log('  GET  /api/quiz/:quizId');
      console.log('  GET  /api/problem/:problemId');
      console.log('  GET  /api/trap-points/:questionId');
      console.log('  POST /api/trap-points');
      console.log('  DELETE /api/trap-points/:trapPointId');
      console.log('\n🎉 Ready to serve trap shadow data!\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n👋 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n👋 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();
