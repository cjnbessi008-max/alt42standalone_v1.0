/**
 * WebSocket Service for real-time metacognition updates
 */

import { io, Socket } from 'socket.io-client';
import type { MetacognitionState, BehaviorEvent, LearningActivity } from '../../../shared/types';

class SocketService {
  private socket: Socket | null = null;
  private readonly serverUrl: string;

  constructor() {
    this.serverUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3001';
  }

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(this.serverUrl, {
      transports: ['websocket'],
      autoConnect: true
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket server');
    });

    this.socket.on('error', (error: any) => {
      console.error('WebSocket error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  identify(studentId: string): void {
    this.socket?.emit('identify', studentId);
  }

  // Activity events
  startActivity(data: {
    studentId: string;
    moduleId: string;
    activityType: string;
    activityName: string;
    metadata?: Record<string, any>;
  }): void {
    this.socket?.emit('activity:start', data);
  }

  completeActivity(data: {
    activityId: string;
    studentId: string;
    outcome?: 'completed' | 'abandoned' | 'in_progress';
    metadata?: Record<string, any>;
  }): void {
    this.socket?.emit('activity:complete', data);
  }

  updateActivity(data: {
    activityId: string;
    studentId: string;
    metadata: Record<string, any>;
  }): void {
    this.socket?.emit('activity:update', data);
  }

  // Behavior tracking
  trackBehavior(data: {
    studentId: string;
    activityId: string;
    events: BehaviorEvent[];
  }): void {
    this.socket?.emit('behavior:track', data);
  }

  // Request metacognition update
  requestMetacognitionUpdate(studentId: string): void {
    this.socket?.emit('metacognition:request', studentId);
  }

  // Event listeners
  onMetacognitionUpdate(callback: (state: MetacognitionState) => void): void {
    this.socket?.on('metacognition:update', callback);
  }

  onActivityStarted(callback: (activity: LearningActivity) => void): void {
    this.socket?.on('activity:started', callback);
  }

  onActivityCompleted(callback: (activity: LearningActivity) => void): void {
    this.socket?.on('activity:completed', callback);
  }

  onFocusAlert(callback: (alert: any) => void): void {
    this.socket?.on('focus:alert', callback);
  }

  onReflectionPrompt(callback: (prompt: any) => void): void {
    this.socket?.on('reflection:prompt', callback);
  }

  // Remove listeners
  offMetacognitionUpdate(): void {
    this.socket?.off('metacognition:update');
  }

  offActivityStarted(): void {
    this.socket?.off('activity:started');
  }

  offActivityCompleted(): void {
    this.socket?.off('activity:completed');
  }

  offFocusAlert(): void {
    this.socket?.off('focus:alert');
  }

  offReflectionPrompt(): void {
    this.socket?.off('reflection:prompt');
  }
}

export const socketService = new SocketService();
