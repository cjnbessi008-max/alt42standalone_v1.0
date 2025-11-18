/**
 * Main Express server for confusion tracking API
 */

import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import confusionRoutes from './routes/confusion.js';
import lmsRoutes from './routes/lms.js';
import moduleRoutes from './routes/modules.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/confusion', confusionRoutes);
app.use('/api/lms', lmsRoutes);
app.use('/api/modules', moduleRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Create HTTP server
const server = createServer(app);

// WebSocket server for real-time updates
const wss = new WebSocketServer({ server, path: '/ws/confusion' });

const clients = new Map<string, Set<WebSocket>>();

wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const studentId = url.pathname.split('/').pop() || '';

  console.log(`WebSocket connection established for student: ${studentId}`);

  // Add client to tracking
  if (!clients.has(studentId)) {
    clients.set(studentId, new Set());
  }
  clients.get(studentId)?.add(ws);

  ws.on('close', () => {
    console.log(`WebSocket connection closed for student: ${studentId}`);
    clients.get(studentId)?.delete(ws);
    if (clients.get(studentId)?.size === 0) {
      clients.delete(studentId);
    }
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for student ${studentId}:`, error);
  });

  // Send initial connection message
  ws.send(JSON.stringify({
    type: 'CONNECTION_ESTABLISHED',
    studentId,
    timestamp: new Date(),
  }));
});

// Broadcast confusion event to student's connected clients
export function broadcastConfusionEvent(studentId: string, event: any) {
  const studentClients = clients.get(studentId);
  if (studentClients) {
    const message = JSON.stringify(event);
    studentClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

// Start server
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║   Confusion Level Tracking API Server                  ║
║   LMS Integration & Real-time Analytics                ║
╚════════════════════════════════════════════════════════╝

🚀 Server running on http://localhost:${PORT}
📊 API endpoints available at http://localhost:${PORT}/api
🔌 WebSocket server at ws://localhost:${PORT}/ws/confusion/:studentId
💚 Health check at http://localhost:${PORT}/api/health

Environment: ${process.env.NODE_ENV || 'development'}
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
