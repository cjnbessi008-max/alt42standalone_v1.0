import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { config } from './config';
import { initializeRedis } from './config/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Routes
import authRoutes from './routes/auth';
import argumentRoutes from './routes/arguments';
import progressRoutes from './routes/progress';

dotenv.config();

const app: Application = express();
const PORT = config.port;

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(cors({
  origin: config.cors.origins,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'ALT42 API Gateway is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/arguments', argumentRoutes);
app.use('/api/progress', progressRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to ALT42 API Gateway',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      arguments: '/api/arguments',
      progress: '/api/progress',
    },
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize server
const startServer = async () => {
  try {
    // Initialize Redis connection
    await initializeRedis();

    // Start server
    app.listen(PORT, () => {
      console.log('=================================');
      console.log('🚀 ALT42 API Gateway');
      console.log('=================================');
      console.log(`Environment: ${config.nodeEnv}`);
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`API Documentation: http://localhost:${PORT}/`);
      console.log('=================================');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
