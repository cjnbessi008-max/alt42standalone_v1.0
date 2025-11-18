/**
 * Express 서버 - Similarity Warm Backend
 * Moodle 3.7 연동 및 닮음 문제 제공
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { moodleRoutes } from './routes/moodle.js';
import { problemRoutes } from './routes/problems.js';
import { progressRoutes } from './routes/progress.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 요청 로깅 미들웨어
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'similarity-warm-backend',
  });
});

// API Routes
app.use('/api/moodle', moodleRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/progress', progressRoutes);

// 404 핸들러
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// 에러 핸들러
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message,
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║   Similarity Warm Backend Server              ║
║   Port: ${PORT}                                    ║
║   Environment: ${process.env.NODE_ENV || 'development'}              ║
║   Moodle URL: ${process.env.MOODLE_URL || 'Not configured'}     ║
╚════════════════════════════════════════════════╝
  `);
});

export default app;
