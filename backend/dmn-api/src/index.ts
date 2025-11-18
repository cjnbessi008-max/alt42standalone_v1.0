import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createLogger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { apiKeyAuth } from './middleware/auth';
import { rateLimiter } from './middleware/rateLimiter';
import dmnRouter from './routes/dmn';
import { initializeDatabase } from './db/connection';

dotenv.config();

const logger = createLogger();
const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || '').split(','),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Rate limiting
app.use('/api', rateLimiter);

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes (with authentication)
app.use('/api/dmn', apiKeyAuth, dmnRouter);

// Error handling
app.use(errorHandler);

// Initialize database and start server
async function start() {
  try {
    await initializeDatabase();
    logger.info('Database connection established');

    app.listen(PORT, () => {
      logger.info(`DMN Rest Routine API server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

start();

export default app;
