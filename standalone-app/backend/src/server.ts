import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Import routes
import authRoutes from './routes/auth.routes';
import problemRoutes from './routes/problem.routes';
import attemptRoutes from './routes/attempt.routes';
import userRoutes from './routes/user.routes';
import analyticsRoutes from './routes/analytics.routes';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';

// Load environment variables
dotenv.config();

const app: Application = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
});

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting
app.use('/api/', rateLimiter);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Socket.IO for real-time features
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Join problem room
  socket.on('join:problem', (problemId: number) => {
    socket.join(`problem:${problemId}`);
    console.log(`Socket ${socket.id} joined problem:${problemId}`);
  });

  // Leave problem room
  socket.on('leave:problem', (problemId: number) => {
    socket.leave(`problem:${problemId}`);
    console.log(`Socket ${socket.id} left problem:${problemId}`);
  });

  // Real-time shape updates (for collaborative mode)
  socket.on('shape:update', (data: { problemId: number; points: any[] }) => {
    socket.to(`problem:${data.problemId}`).emit('shape:updated', data.points);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║   🚀 Reflection Mode API Server               ║
║                                               ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(29)} ║
║   Port: ${PORT.toString().padEnd(36)} ║
║   URL: http://localhost:${PORT.toString().padEnd(23)} ║
║                                               ║
║   📚 API Docs: /api/docs                      ║
║   ❤️  Health: /health                          ║
╚═══════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export { app, io };
