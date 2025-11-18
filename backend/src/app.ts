import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { testConnection } from './config/database';
import routes from './routes';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(morgan('dev')); // Logging
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: process.env.REQUEST_LIMIT || '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use(API_PREFIX, routes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Mathematical Garden API',
    version: '1.0.0',
    description: 'Backend API for Mathematical Garden - Interactive Math Learning',
    endpoints: {
      health: `${API_PREFIX}/health`,
      problems: `${API_PREFIX}/problems`,
      sessions: `${API_PREFIX}/sessions`,
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log('');
      console.log('═══════════════════════════════════════════════');
      console.log('  🌸 Mathematical Garden API Server');
      console.log('═══════════════════════════════════════════════');
      console.log(`  Server:    http://${process.env.HOST || 'localhost'}:${PORT}`);
      console.log(`  API:       http://${process.env.HOST || 'localhost'}:${PORT}${API_PREFIX}`);
      console.log(`  Health:    http://${process.env.HOST || 'localhost'}:${PORT}${API_PREFIX}/health`);
      console.log(`  Env:       ${process.env.NODE_ENV || 'development'}`);
      console.log('═══════════════════════════════════════════════');
      console.log('');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
