/**
 * WebSocket middleware and handlers
 * Manages real-time DMN status updates
 */

const logger = require('../utils/logger');
const config = require('../config/config');

// Store active connections
const connections = new Map();

function initializeWebSocket(io) {
  io.on('connection', (socket) => {
    logger.info(`WebSocket client connected: ${socket.id}`);

    // Handle student session subscription
    socket.on('subscribe:student', (data) => {
      const { studentId, sessionId } = data;

      if (!studentId || !sessionId) {
        socket.emit('error', { message: 'Missing studentId or sessionId' });
        return;
      }

      const room = `student:${studentId}:${sessionId}`;
      socket.join(room);

      connections.set(socket.id, {
        studentId,
        sessionId,
        room,
        connectedAt: new Date()
      });

      logger.info(`Client ${socket.id} subscribed to ${room}`);

      socket.emit('subscribed', {
        studentId,
        sessionId,
        message: 'Successfully subscribed to DMN status updates'
      });
    });

    // Handle course/classroom subscription (for teachers)
    socket.on('subscribe:course', (data) => {
      const { courseId, userId } = data;

      if (!courseId) {
        socket.emit('error', { message: 'Missing courseId' });
        return;
      }

      const room = `course:${courseId}`;
      socket.join(room);

      logger.info(`Client ${socket.id} (user: ${userId}) subscribed to course ${courseId}`);

      socket.emit('subscribed', {
        courseId,
        message: 'Successfully subscribed to course DMN updates'
      });
    });

    // Handle interaction event from client
    socket.on('interaction:event', async (eventData) => {
      try {
        const connection = connections.get(socket.id);

        if (!connection) {
          socket.emit('error', { message: 'Not subscribed to any session' });
          return;
        }

        // Forward event for processing (in production, this would go to a queue)
        logger.debug(`Received interaction event from ${connection.studentId}: ${eventData.event_type}`);

        // Acknowledge receipt
        socket.emit('event:acknowledged', {
          timestamp: eventData.timestamp
        });

      } catch (error) {
        logger.error(`Error processing interaction event: ${error.message}`);
        socket.emit('error', { message: 'Failed to process event' });
      }
    });

    // Handle unsubscribe
    socket.on('unsubscribe', () => {
      const connection = connections.get(socket.id);
      if (connection) {
        socket.leave(connection.room);
        connections.delete(socket.id);
        logger.info(`Client ${socket.id} unsubscribed from ${connection.room}`);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const connection = connections.get(socket.id);
      if (connection) {
        logger.info(`Client ${socket.id} disconnected from ${connection.room}`);
        connections.delete(socket.id);
      } else {
        logger.info(`WebSocket client disconnected: ${socket.id}`);
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`WebSocket error for ${socket.id}: ${error.message}`);
    });
  });

  logger.info('WebSocket handlers initialized');
}

/**
 * Broadcast DMN status update to subscribed clients
 */
function broadcastDMNStatus(io, dmnStatus) {
  const { student_id, session_id, course_id } = dmnStatus;

  // Broadcast to student's session room
  const studentRoom = `student:${student_id}:${session_id}`;
  io.to(studentRoom).emit('dmn:status', dmnStatus);

  // Broadcast to course room (for teachers monitoring)
  const courseRoom = `course:${course_id}`;
  io.to(courseRoom).emit('dmn:status', dmnStatus);

  logger.debug(`Broadcasted DMN status for student ${student_id} to rooms`);
}

/**
 * Get connection statistics
 */
function getConnectionStats() {
  const stats = {
    totalConnections: connections.size,
    connections: Array.from(connections.values()).map(conn => ({
      studentId: conn.studentId,
      sessionId: conn.sessionId,
      connectedAt: conn.connectedAt
    }))
  };

  return stats;
}

module.exports = {
  initializeWebSocket,
  broadcastDMNStatus,
  getConnectionStats
};
