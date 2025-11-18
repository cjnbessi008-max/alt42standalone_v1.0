import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { redisClient } from '../redis';
import jwt from 'jsonwebtoken';

interface SocketData {
  userId: string;
  sessionId?: string;
}

export function setupWebSocket(io: SocketIOServer): void {
  // Authentication middleware for WebSocket
  io.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      (socket.data as SocketData).userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const socketData = socket.data as SocketData;
    logger.info(`WebSocket client connected: ${socket.id}, user: ${socketData.userId}`);

    // Join session room
    socket.on('join-session', (sessionId: string) => {
      socket.join(`session:${sessionId}`);
      socketData.sessionId = sessionId;
      logger.info(`User ${socketData.userId} joined session ${sessionId}`);
    });

    // Handle action events from client
    socket.on('action', async (data) => {
      try {
        const { sessionId, actionType, actionData } = data;

        // Broadcast to session room
        io.to(`session:${sessionId}`).emit('action-received', {
          actionType,
          actionData,
          timestamp: new Date().toISOString(),
        });

        logger.info(`Action received: ${actionType} for session ${sessionId}`);
      } catch (error) {
        logger.error('Error handling action event:', error);
        socket.emit('error', { message: 'Failed to process action' });
      }
    });

    // Request current summary
    socket.on('request-summary', async (data) => {
      try {
        const { stepId } = data;

        // Check cache first
        const cached = await redisClient.get(`summary:${stepId}`);
        if (cached) {
          socket.emit('summary-update', JSON.parse(cached));
          return;
        }

        socket.emit('summary-pending', { stepId });
      } catch (error) {
        logger.error('Error handling summary request:', error);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`WebSocket client disconnected: ${socket.id}`);
    });
  });

  // Subscribe to Redis action events for broadcasting
  subscribeToActionEvents(io);
}

async function subscribeToActionEvents(io: SocketIOServer): void {
  const subscriber = redisClient.duplicate();
  await subscriber.connect();

  await subscriber.subscribe('action-events', (message) => {
    try {
      const action = JSON.parse(message);
      io.to(`session:${action.session_id}`).emit('step-detected', action);
    } catch (error) {
      logger.error('Error processing action event:', error);
    }
  });

  await subscriber.subscribe('summary-updates', (message) => {
    try {
      const update = JSON.parse(message);
      io.to(`session:${update.sessionId}`).emit('summary-update', update);
    } catch (error) {
      logger.error('Error processing summary update:', error);
    }
  });

  logger.info('Subscribed to Redis action events');
}
