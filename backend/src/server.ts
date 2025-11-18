/**
 * Express Server for Calming Message Feature
 * Main entry point for backend API
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import calmingMessageRoutes, { setCalmingMessageDB } from './routes/calmingMessage.routes';
import db from './config/database';

const app: Application = express();
const PORT = process.env.PORT || 3001;

// ============================================================
// Middleware
// ============================================================
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Serve static files (audio files)
app.use('/audio', express.static(path.join(__dirname, '../../public/audio')));

// ============================================================
// Database Setup
// ============================================================
setCalmingMessageDB(db);

// ============================================================
// Routes
// ============================================================
app.use('/api', calmingMessageRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Calming Message API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      config: '/api/modules/:moduleId/calming-config',
      audio: '/api/modules/:moduleId/audio/calming_message_:level',
      interactions: '/api/modules/:moduleId/interactions/calming_message',
      analytics: '/api/modules/:moduleId/analytics/calming_messages'
    }
  });
});

// ============================================================
// Error Handling
// ============================================================
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// ============================================================
// Server Start
// ============================================================
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║  🎓 Calming Message API Server                         ║
║  📡 Server running on port ${PORT}                      ║
║  🌍 Environment: ${process.env.NODE_ENV || 'development'}                    ║
║  📂 Static files: /public/audio                        ║
╚════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    db.end(() => {
      console.log('Database connection closed');
      process.exit(0);
    });
  });
});

export default app;
