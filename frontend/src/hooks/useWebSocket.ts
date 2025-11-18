import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useWebSocket(sessionId: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Get token from localStorage (in a real app)
    const token = localStorage.getItem('token') || 'demo-token';

    const newSocket = io(API_URL, {
      auth: { token },
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
      newSocket.emit('join-session', sessionId);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    newSocket.on('summary-update', (data) => {
      console.log('Summary update:', data);
      // Handle summary updates in parent component
    });

    newSocket.on('step-detected', (data) => {
      console.log('New step detected:', data);
      // Handle step changes
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [sessionId]);

  const sendAction = useCallback(
    (actionType: string, actionData: any) => {
      if (socket && connected) {
        socket.emit('action', {
          sessionId,
          actionType,
          actionData,
          timestamp: new Date().toISOString(),
        });
      }
    },
    [socket, connected, sessionId]
  );

  return { socket, connected, sendAction };
}
