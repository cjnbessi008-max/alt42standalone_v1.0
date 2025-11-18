import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MoodleApiService } from './services/moodleApi.service';
import { CorrelationService } from './services/correlation.service';
import { createMoodleRouter } from './routes/moodle.routes';
import { createCorrelationRouter } from './routes/correlation.routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Validate required environment variables
if (!process.env.MOODLE_URL || !process.env.MOODLE_TOKEN) {
  console.error('Error: MOODLE_URL and MOODLE_TOKEN must be set in environment variables');
  process.exit(1);
}

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Initialize services
const moodleApi = new MoodleApiService(
  process.env.MOODLE_URL,
  process.env.MOODLE_TOKEN
);

const correlationService = new CorrelationService(moodleApi);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    moodleUrl: process.env.MOODLE_URL
  });
});

// API routes
const apiPrefix = process.env.API_PREFIX || '/api';
app.use(`${apiPrefix}/moodle`, createMoodleRouter(moodleApi));
app.use(`${apiPrefix}/correlation`, createCorrelationRouter(correlationService));

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 Correlation Heat Backend Server');
  console.log('='.repeat(60));
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 Moodle URL: ${process.env.MOODLE_URL}`);
  console.log(`🔗 API endpoint: http://localhost:${PORT}${apiPrefix}`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(60));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
