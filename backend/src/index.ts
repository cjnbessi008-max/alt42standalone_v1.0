import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { testConnection } from './config/database';

// Import routes
import problemRoutes from './routes/problemRoutes';
import answerRoutes from './routes/answerRoutes';
import studentRoutes from './routes/studentRoutes';
import moodleRoutes from './routes/moodleRoutes';

// Load environment variables
dotenv.config();

// Create Express app
const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // HTTP request logger

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/problems', problemRoutes);
app.use('/api/answers', answerRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/moodle', moodleRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Correspondence Lines API',
    version: '1.0.0',
    endpoints: {
      problems: '/api/problems',
      answers: '/api/answers',
      students: '/api/students',
      moodle: '/api/moodle',
      health: '/health',
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Start server
async function startServer() {
  try {
    // Test database connection
    await testConnection();

    // Start listening
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 Correspondence Lines API Server');
      console.log('=====================================');
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Database: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
      console.log(`📚 API Docs: http://localhost:${PORT}/`);
      console.log('=====================================');
      console.log('');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
