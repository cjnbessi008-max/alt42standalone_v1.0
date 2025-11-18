import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import logger from './utils/logger';

// Routes
import routineRoutes from './routes/routine.routes';
import moodleRoutes from './routes/moodle.routes';
import userRoutes from './routes/user.routes';
import healthRoutes from './routes/health.routes';

// Load environment variables
dotenv.config();

const app: Express = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// API Routes
const apiPrefix = process.env.API_PREFIX || '/api/v1';

app.use(`${apiPrefix}/health`, healthRoutes);
app.use(`${apiPrefix}/routines`, routineRoutes);
app.use(`${apiPrefix}/moodle`, moodleRoutes);
app.use(`${apiPrefix}/users`, userRoutes);

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: '🧘 Relaxation Routine API',
    version: '1.0.0',
    endpoints: {
      health: `${apiPrefix}/health`,
      routines: `${apiPrefix}/routines`,
      moodle: `${apiPrefix}/moodle`,
      users: `${apiPrefix}/users`,
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;
