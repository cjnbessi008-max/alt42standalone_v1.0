import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

class SocketService {
  private socket: Socket | null = null;

  connect(): Socket {
    if (!this.socket) {
      this.socket = io(WS_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      this.socket.on('connect', () => {
        console.log('🔌 WebSocket connected');
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 WebSocket disconnected');
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
      });
    }

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // Student methods
  studentJoin(studentId: string, problemId: string, attemptId: string) {
    this.socket?.emit('student:join', { studentId, problemId, attemptId });
  }

  trackBehavior(eventData: any) {
    this.socket?.emit('behavior:track', eventData);
  }

  requestHint(problemId: string, level: number) {
    this.socket?.emit('hint:request', { problemId, level });
  }

  dismissOverthinking(eventId: string) {
    this.socket?.emit('overthinking:dismiss', { eventId });
  }

  // Teacher methods
  teacherJoin(teacherId: string) {
    this.socket?.emit('teacher:join', { teacherId });
  }

  // Event listeners
  onHintSuggest(callback: (data: any) => void) {
    this.socket?.on('overthinking:hint_suggest', callback);
  }

  onOverthinkingAlert(callback: (data: any) => void) {
    this.socket?.on('overthinking:alert', callback);
  }

  onHintResponse(callback: (data: any) => void) {
    this.socket?.on('hint:response', callback);
  }

  onStudentStruggling(callback: (data: any) => void) {
    this.socket?.on('alert:student_struggling', callback);
  }

  offHintSuggest(callback?: (data: any) => void) {
    this.socket?.off('overthinking:hint_suggest', callback);
  }

  offOverthinkingAlert(callback?: (data: any) => void) {
    this.socket?.off('overthinking:alert', callback);
  }

  offHintResponse(callback?: (data: any) => void) {
    this.socket?.off('hint:response', callback);
  }

  offStudentStruggling(callback?: (data: any) => void) {
    this.socket?.off('alert:student_struggling', callback);
  }
}

export const socketService = new SocketService();
