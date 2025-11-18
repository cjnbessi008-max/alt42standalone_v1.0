import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';

export function setupWebSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    logger.info(`WebSocket client connected: ${socket.id}`);

    // Join session room for real-time updates
    socket.on('join_session', (sessionId: string) => {
      socket.join(`session:${sessionId}`);
      logger.info(`Socket ${socket.id} joined session ${sessionId}`);

      socket.emit('session_joined', {
        sessionId,
        message: 'Successfully joined session room',
      });
    });

    // Leave session room
    socket.on('leave_session', (sessionId: string) => {
      socket.leave(`session:${sessionId}`);
      logger.info(`Socket ${socket.id} left session ${sessionId}`);
    });

    // Join student monitoring room (for teachers)
    socket.on('monitor_student', (studentId: string) => {
      socket.join(`student:${studentId}`);
      logger.info(`Socket ${socket.id} monitoring student ${studentId}`);

      socket.emit('monitoring_started', {
        studentId,
        message: 'Student monitoring started',
      });
    });

    // Stop monitoring student
    socket.on('stop_monitoring_student', (studentId: string) => {
      socket.leave(`student:${studentId}`);
      logger.info(`Socket ${socket.id} stopped monitoring student ${studentId}`);
    });

    // Heartbeat for keeping connection alive
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`WebSocket client disconnected: ${socket.id}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('WebSocket error:', error);
    });
  });

  logger.info('✅ WebSocket handlers configured');
}

/**
 * Emit event to specific session
 */
export function emitToSession(io: Server, sessionId: string, event: string, data: any): void {
  io.to(`session:${sessionId}`).emit(event, data);
}

/**
 * Emit event to monitors of a specific student
 */
export function emitToStudentMonitors(io: Server, studentId: string, event: string, data: any): void {
  io.to(`student:${studentId}`).emit(event, data);
}
