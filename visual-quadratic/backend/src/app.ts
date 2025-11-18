import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import routes
import problemsRouter from './routes/problems.js';
import progressRouter from './routes/progress.js';
import studentsRouter from './routes/students.js';
import moodleRouter from './routes/moodle.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/problems', problemsRouter);
app.use('/api/progress', progressRouter);
app.use('/api/students', studentsRouter);
app.use('/api/moodle', moodleRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Visual Quadratic API',
    version: '1.0.0',
    description: 'Backend API for Visual Quadratic learning app',
    endpoints: {
      health: '/health',
      problems: '/api/problems',
      progress: '/api/progress',
      students: '/api/students',
      moodle: '/api/moodle',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Visual Quadratic API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Server running on: http://localhost:${PORT}
  Environment: ${process.env.NODE_ENV || 'development'}
  Database: ${process.env.DB_NAME || 'visual_quadratic'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

export default app;
