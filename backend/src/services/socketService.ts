/**
 * WebSocket Service
 * Real-time communication for metacognition mirroring
 */

import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger.js';
import { MetacognitionService } from './metacognitionService.js';
import { ActivityService } from './activityService.js';
import { BehaviorService } from './behaviorService.js';
import type { WebSocketEventType } from '../../../shared/types/index.js';

const metacognitionService = new MetacognitionService();
const activityService = new ActivityService();
const behaviorService = new BehaviorService();

// Track connected students
const connectedStudents = new Map<string, Socket>();

export function setupSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Student identification
    socket.on('identify', (studentId: string) => {
      connectedStudents.set(studentId, socket);
      socket.data.studentId = studentId;
      logger.info(`Student identified: ${studentId}`);

      // Send initial metacognition state
      sendMetacognitionUpdate(socket, studentId);
    });

    // Activity events
    socket.on('activity:start', async (data) => {
      try {
        const { studentId, moduleId, activityType, activityName, metadata } = data;

        const activity = await activityService.startActivity({
          studentId,
          moduleId,
          activityType,
          activityName,
          metadata
        });

        socket.emit('activity:started', activity);

        // Broadcast to other listeners (e.g., teacher dashboard)
        socket.broadcast.emit('student:activity:started', {
          studentId,
          activity
        });

        // Send updated metacognition state
        setTimeout(() => sendMetacognitionUpdate(socket, studentId), 1000);

      } catch (error: any) {
        logger.error('Error starting activity:', error);
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('activity:complete', async (data) => {
      try {
        const { activityId, studentId, outcome, metadata } = data;

        const activity = await activityService.completeActivity({
          activityId,
          studentId,
          outcome,
          metadata
        });

        socket.emit('activity:completed', activity);

        // Send updated metacognition state
        setTimeout(() => sendMetacognitionUpdate(socket, studentId), 1000);

      } catch (error: any) {
        logger.error('Error completing activity:', error);
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('activity:update', async (data) => {
      try {
        const { activityId, studentId, metadata } = data;

        await activityService.updateActivityMetadata(activityId, studentId, metadata);

        // Send updated metacognition state
        sendMetacognitionUpdate(socket, studentId);

      } catch (error: any) {
        logger.error('Error updating activity:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Behavior tracking events
    socket.on('behavior:track', async (data) => {
      try {
        const { studentId, activityId, events } = data;

        const result = await behaviorService.trackBehaviorEvents({
          studentId,
          activityId,
          events
        });

        socket.emit('behavior:tracked', result);

        // Check for focus alerts
        if (result.analysis) {
          const { focusLevel } = result.analysis;
          if (focusLevel === 'distracted' || focusLevel === 'highly_distracted') {
            socket.emit('focus:alert', {
              level: focusLevel,
              recommendations: ['휴식을 취해보세요', '학습 환경을 점검해보세요']
            });
          }
        }

        // Send updated metacognition state periodically (not on every event)
        // Use a simple rate limiting approach
        if (!socket.data.lastMetacognitionUpdate ||
            Date.now() - socket.data.lastMetacognitionUpdate > 5000) {
          sendMetacognitionUpdate(socket, studentId);
          socket.data.lastMetacognitionUpdate = Date.now();
        }

      } catch (error: any) {
        logger.error('Error tracking behavior:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Request metacognition update
    socket.on('metacognition:request', async (studentId: string) => {
      await sendMetacognitionUpdate(socket, studentId);
    });

    // Disconnection
    socket.on('disconnect', () => {
      const studentId = socket.data.studentId;
      if (studentId) {
        connectedStudents.delete(studentId);
        logger.info(`Student disconnected: ${studentId}`);
      }
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  // Periodic metacognition updates for all connected students
  setInterval(() => {
    connectedStudents.forEach((socket, studentId) => {
      sendMetacognitionUpdate(socket, studentId);
    });
  }, 30000); // Every 30 seconds
}

/**
 * Send metacognition update to a student
 */
async function sendMetacognitionUpdate(socket: Socket, studentId: string): Promise<void> {
  try {
    const metacognitionState = await metacognitionService.getMetacognitionState({
      studentId
    });

    socket.emit('metacognition:update', metacognitionState);

    // Send reflection prompts if any are high priority
    const highPriorityPrompts = metacognitionState.reflectionPrompts.filter(
      p => p.priority === 'high'
    );

    if (highPriorityPrompts.length > 0) {
      socket.emit('reflection:prompt', highPriorityPrompts[0]);
    }

  } catch (error: any) {
    logger.error(`Error sending metacognition update to student ${studentId}:`, error);
  }
}

/**
 * Broadcast metacognition update to a specific student (useful for external triggers)
 */
export async function broadcastMetacognitionUpdate(
  io: Server,
  studentId: string
): Promise<void> {
  const socket = connectedStudents.get(studentId);
  if (socket) {
    await sendMetacognitionUpdate(socket, studentId);
  }
}
