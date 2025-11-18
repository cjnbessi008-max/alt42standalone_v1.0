import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/database';
import problemsRouter from './routes/problems';
import progressRouter from './routes/progress';
import moodleRouter from './routes/moodle';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Balance Machine API',
  });
});

// API Routes
app.use('/api/problems', problemsRouter);
app.use('/api/progress', progressRouter);
app.use('/api/moodle', moodleRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
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
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('⚠️  Database connection failed. Server starting anyway...');
    }

    app.listen(PORT, () => {
      console.log('\n🚀 Balance Machine API Server');
      console.log(`📍 Server running on: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 API Base URL: http://localhost:${PORT}/api`);
      console.log(`\n📚 Available endpoints:`);
      console.log(`   GET  /api/problems - Get all problems`);
      console.log(`   GET  /api/problems/:id - Get specific problem`);
      console.log(`   GET  /api/problems/:id/hints - Get problem with hints`);
      console.log(`   POST /api/problems - Create new problem`);
      console.log(`   GET  /api/progress/:studentId - Get student progress`);
      console.log(`   GET  /api/progress/:studentId/stats - Get student stats`);
      console.log(`   POST /api/progress - Start new problem`);
      console.log(`   POST /api/progress/submit - Submit answer attempt`);
      console.log(`\n✨ Server ready!\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
