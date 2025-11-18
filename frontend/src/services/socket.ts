import { io, Socket } from 'socket.io-client';
import type { TreeNode, SocketEvents } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket.IO connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO disconnected:', reason);
    });

    this.socket.on('error', (error) => {
      console.error('Socket.IO error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  // =============================================
  // Emit Events
  // =============================================

  joinSession(sessionId: string, userId: string) {
    this.socket?.emit('join-session', { sessionId, userId });
  }

  navigateNode(
    sessionId: string,
    nodeId: string,
    sequenceOrder: number,
    studentInput?: any
  ) {
    this.socket?.emit('navigate-node', {
      sessionId,
      nodeId,
      sequenceOrder,
      studentInput
    });
  }

  addNode(
    problemId: string,
    nodeType: 'problem' | 'approach' | 'step' | 'answer',
    label: string,
    parentId: string | null = null,
    description?: string,
    positionX: number = 0,
    positionY: number = 0
  ) {
    this.socket?.emit('add-node', {
      problemId,
      parentId,
      nodeType,
      label,
      description,
      positionX,
      positionY
    });
  }

  updateNodePosition(nodeId: string, positionX: number, positionY: number) {
    this.socket?.emit('update-node-position', {
      nodeId,
      positionX,
      positionY
    });
  }

  submitAnswer(
    sessionId: string,
    nodeId: string,
    answer: any,
    isCorrect: boolean
  ) {
    this.socket?.emit('submit-answer', {
      sessionId,
      nodeId,
      answer,
      isCorrect
    });
  }

  // =============================================
  // Listen to Events
  // =============================================

  onTreeState(callback: (data: { problem_id: string; nodes: TreeNode[] }) => void) {
    this.socket?.on('tree-state', callback);
    this.addListener('tree-state', callback);
  }

  onNodeVisited(callback: (data: { nodeId: string; sequenceOrder: number; timestamp: string }) => void) {
    this.socket?.on('node-visited', callback);
    this.addListener('node-visited', callback);
  }

  onNodeAdded(callback: (data: { problemId: string; node: TreeNode }) => void) {
    this.socket?.on('node-added', callback);
    this.addListener('node-added', callback);
  }

  onNodePositionUpdated(callback: (data: { nodeId: string; positionX: number; positionY: number }) => void) {
    this.socket?.on('node-position-updated', callback);
    this.addListener('node-position-updated', callback);
  }

  onAnswerFeedback(callback: (data: { nodeId: string; isCorrect: boolean; timestamp: string }) => void) {
    this.socket?.on('answer-feedback', callback);
    this.addListener('answer-feedback', callback);
  }

  // =============================================
  // Helper Methods
  // =============================================

  private addListener(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  removeListener(event: string, callback: Function) {
    this.socket?.off(event, callback as any);
    this.listeners.get(event)?.delete(callback);
  }

  removeAllListeners(event?: string) {
    if (event) {
      this.socket?.off(event);
      this.listeners.delete(event);
    } else {
      this.socket?.removeAllListeners();
      this.listeners.clear();
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
