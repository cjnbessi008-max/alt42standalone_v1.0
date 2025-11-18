import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import moodleRoutes from './routes/moodle';
import summaryRoutes from './routes/summary';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Alt42 Backend',
  });
});

// API routes
app.use('/api/moodle', moodleRoutes);
app.use('/api/summary', summaryRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║   Alt42 Backend Server                        ║
║   Port: ${PORT}                                   ║
║   Environment: ${process.env.NODE_ENV || 'development'}                ║
║   Moodle URL: ${process.env.MOODLE_URL || 'Not configured'}
║                                               ║
║   Endpoints:                                  ║
║   - GET  /health                              ║
║   - GET  /api/moodle/test                     ║
║   - GET  /api/moodle/question/:id             ║
║   - GET  /api/moodle/quiz/:id/questions       ║
║   - POST /api/summary/generate                ║
║   - GET  /api/summary/question/:id            ║
║   - GET  /api/summary/test                    ║
╚═══════════════════════════════════════════════╝
  `);
});

export default app;
