import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { PraiseEvent } from '../services/VoicePraiseService';

interface UseVoicePraiseOptions {
  studentId: string;
  moduleId: string;
  serverUrl?: string;
}

interface UseVoicePraiseReturn {
  currentPraise: PraiseEvent | null;
  isConnected: boolean;
  submitProgress: (progressData: any) => Promise<void>;
  clearPraise: () => void;
}

/**
 * Custom hook for voice praise integration
 */
export const useVoicePraise = ({
  studentId,
  moduleId,
  serverUrl = 'http://localhost:5000'
}: UseVoicePraiseOptions): UseVoicePraiseReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentPraise, setCurrentPraise] = useState<PraiseEvent | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(serverUrl);

    newSocket.on('connect', () => {
      console.log('✅ Connected to voice praise server');
      setIsConnected(true);

      // Join student room
      newSocket.emit('student-join', { studentId, moduleId });
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from voice praise server');
      setIsConnected(false);
    });

    // Listen for praise events
    newSocket.on('voice-praise', (praiseEvent: PraiseEvent) => {
      console.log('🎉 Received praise event:', praiseEvent);
      setCurrentPraise(praiseEvent);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [studentId, moduleId, serverUrl]);

  /**
   * Submit progress update to server
   */
  const submitProgress = async (progressData: any): Promise<void> => {
    if (!socket || !isConnected) {
      console.warn('Socket not connected, cannot submit progress');
      return;
    }

    // Send progress update via socket
    socket.emit('progress-update', {
      studentId,
      moduleId,
      progressData
    });

    // Also send via HTTP for reliability
    try {
      const response = await fetch(`${serverUrl}/api/progress/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentId,
          moduleId,
          progressData
        })
      });

      const result = await response.json();

      if (result.praiseTriggered && result.praiseEvent) {
        // Backup: if socket didn't deliver, show via HTTP response
        if (!currentPraise) {
          setCurrentPraise(result.praiseEvent);
        }
      }
    } catch (error) {
      console.error('Failed to submit progress via HTTP:', error);
    }
  };

  /**
   * Clear current praise notification
   */
  const clearPraise = (): void => {
    setCurrentPraise(null);
  };

  return {
    currentPraise,
    isConnected,
    submitProgress,
    clearPraise
  };
};
