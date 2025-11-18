/**
 * Custom hook for managing DMN status with WebSocket
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { DMNStatusData, InteractionEvent } from '../types/dmn.types';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

interface UseDMNStatusOptions {
  studentId: string;
  sessionId: string;
  courseId?: string;
  autoConnect?: boolean;
}

interface UseDMNStatusReturn {
  currentStatus: DMNStatusData | null;
  history: DMNStatusData[];
  connected: boolean;
  error: string | null;
  sendEvent: (event: Omit<InteractionEvent, 'student_id' | 'session_id' | 'timestamp'>) => void;
  clearHistory: () => void;
}

export const useDMNStatus = ({
  studentId,
  sessionId,
  courseId,
  autoConnect = true,
}: UseDMNStatusOptions): UseDMNStatusReturn => {
  const [currentStatus, setCurrentStatus] = useState<DMNStatusData | null>(null);
  const [history, setHistory] = useState<DMNStatusData[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const eventBufferRef = useRef<InteractionEvent[]>([]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!autoConnect || !studentId || !sessionId) return;

    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
      setError(null);

      // Subscribe to student session
      socket.emit('subscribe:student', {
        studentId,
        sessionId,
      });
    });

    socket.on('subscribed', (data) => {
      console.log('Subscribed to DMN updates:', data);
    });

    socket.on('dmn:status', (status: DMNStatusData) => {
      console.log('Received DMN status update:', status);
      setCurrentStatus(status);
      setHistory((prev) => [...prev, status].slice(-100)); // Keep last 100 statuses
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    socket.on('error', (err) => {
      console.error('WebSocket error:', err);
      setError(err.message || 'WebSocket error');
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setError('Failed to connect to server');
      setConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [studentId, sessionId, autoConnect]);

  // Send interaction event
  const sendEvent = useCallback((
    event: Omit<InteractionEvent, 'student_id' | 'session_id' | 'timestamp'>
  ) => {
    if (!socketRef.current || !connected) {
      console.warn('Cannot send event: not connected');
      return;
    }

    const fullEvent: InteractionEvent = {
      ...event,
      student_id: studentId,
      session_id: sessionId,
      timestamp: new Date().toISOString(),
    };

    socketRef.current.emit('interaction:event', fullEvent);

    // Buffer events for batch analysis
    eventBufferRef.current.push(fullEvent);

    // If buffer reaches certain size, we could trigger analysis
    // For now, just log
    console.log('Event sent:', fullEvent.event_type);
  }, [studentId, sessionId, connected]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    currentStatus,
    history,
    connected,
    error,
    sendEvent,
    clearHistory,
  };
};
