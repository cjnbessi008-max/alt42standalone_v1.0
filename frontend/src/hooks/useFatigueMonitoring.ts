/**
 * useFatigueMonitoring Hook
 *
 * Custom React hook for managing fatigue monitoring with WebSocket connection.
 * Handles real-time updates, break recommendations, and API calls.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

interface FatigueState {
  sessionId: string | null;
  fatigueScore: number;
  fatigueLevel: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  isActive: boolean;
}

interface BreakRecommendation {
  id: string;
  breakType: 'micro' | 'short' | 'medium' | 'long';
  durationMinutes: number;
  reason: string;
  fatigueScore: number;
  urgency: 'low' | 'medium' | 'high';
  status: 'pending' | 'accepted' | 'dismissed' | 'deferred';
}

interface UseFatigueMonitoringReturn {
  // State
  fatigueState: FatigueState;
  currentRecommendation: BreakRecommendation | null;
  isConnected: boolean;
  error: string | null;

  // Actions
  startSession: (studentId: string, moduleId: string) => Promise<void>;
  endSession: () => Promise<void>;
  recordMetric: (data: MetricData) => Promise<void>;
  acceptBreak: (recommendationId: string) => Promise<void>;
  dismissBreak: (recommendationId: string, reason: string) => Promise<void>;
  deferBreak: (recommendationId: string, minutes: number) => Promise<void>;
  completeBreak: (recommendationId: string, duration: number, activities: string[]) => Promise<void>;
}

interface MetricData {
  complexityLevel: number;
  problemsCompleted: number;
  correctAnswers: number;
  responseTimes: number[];
  interactionCount: number;
}

export const useFatigueMonitoring = (
  studentId: string
): UseFatigueMonitoringReturn => {
  // State
  const [fatigueState, setFatigueState] = useState<FatigueState>({
    sessionId: null,
    fatigueScore: 0,
    fatigueLevel: 1,
    trend: 'stable',
    isActive: false
  });

  const [currentRecommendation, setCurrentRecommendation] = useState<BreakRecommendation | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // WebSocket ref
  const wsRef = useRef<WebSocket | null>(null);

  // Connect to WebSocket
  const connectWebSocket = useCallback((sessionId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    const ws = new WebSocket(`${WS_BASE_URL}/api/fatigue/realtime/${sessionId}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.event) {
        case 'connected':
          console.log('Fatigue monitoring connected:', message.data);
          break;

        case 'fatigue_updated':
          setFatigueState((prev) => ({
            ...prev,
            fatigueScore: message.data.fatigue_score,
            fatigueLevel: message.data.fatigue_level,
            trend: message.data.trend
          }));
          break;

        case 'break_recommended':
          setCurrentRecommendation({
            id: message.data.recommendation_id,
            breakType: message.data.break_type,
            durationMinutes: message.data.duration_minutes,
            reason: message.data.reason,
            fatigueScore: message.data.fatigue_score || 0,
            urgency: message.data.urgency,
            status: 'pending'
          });
          break;

        case 'break_reminder':
          // Show reminder notification
          console.log('Break reminder:', message.data);
          break;

        case 'recovery_progress':
          // Update recovery progress during break
          console.log('Recovery progress:', message.data);
          break;

        case 'achievement':
          // Show achievement notification
          console.log('Achievement:', message.data);
          break;

        default:
          console.log('Unknown message:', message);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('WebSocket connection error');
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);

      // Attempt to reconnect after 5 seconds if session is still active
      if (fatigueState.isActive) {
        setTimeout(() => {
          connectWebSocket(sessionId);
        }, 5000);
      }
    };

    wsRef.current = ws;
  }, [fatigueState.isActive]);

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Start new fatigue session
  const startSession = useCallback(async (studentId: string, moduleId: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/fatigue/sessions`, {
        student_id: studentId,
        module_id: moduleId
      });

      const sessionId = response.data.id;

      setFatigueState({
        sessionId,
        fatigueScore: response.data.fatigue_score,
        fatigueLevel: response.data.fatigue_level,
        trend: 'stable',
        isActive: true
      });

      // Connect WebSocket
      connectWebSocket(sessionId);

      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to start session');
      console.error('Error starting session:', err);
    }
  }, [connectWebSocket]);

  // End current session
  const endSession = useCallback(async () => {
    if (!fatigueState.sessionId) return;

    try {
      await axios.put(`${API_BASE_URL}/api/fatigue/sessions/${fatigueState.sessionId}/end`);

      setFatigueState({
        sessionId: null,
        fatigueScore: 0,
        fatigueLevel: 1,
        trend: 'stable',
        isActive: false
      });

      // Disconnect WebSocket
      disconnectWebSocket();

      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to end session');
      console.error('Error ending session:', err);
    }
  }, [fatigueState.sessionId, disconnectWebSocket]);

  // Record fatigue metric
  const recordMetric = useCallback(async (data: MetricData) => {
    if (!fatigueState.sessionId) return;

    try {
      const response = await axios.post(`${API_BASE_URL}/api/fatigue/metrics`, {
        session_id: fatigueState.sessionId,
        complexity_level: data.complexityLevel,
        problems_completed: data.problemsCompleted,
        correct_answers: data.correctAnswers,
        response_times: data.responseTimes,
        interaction_count: data.interactionCount
      });

      // Update local state with calculated fatigue
      setFatigueState((prev) => ({
        ...prev,
        fatigueScore: response.data.fatigue_score,
        fatigueLevel: response.data.fatigue_level,
        trend: response.data.trend
      }));

      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to record metric');
      console.error('Error recording metric:', err);
    }
  }, [fatigueState.sessionId]);

  // Accept break recommendation
  const acceptBreak = useCallback(async (recommendationId: string) => {
    try {
      await axios.put(`${API_BASE_URL}/api/fatigue/breaks/${recommendationId}/accept`);

      setCurrentRecommendation((prev) =>
        prev ? { ...prev, status: 'accepted' } : null
      );

      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to accept break');
      console.error('Error accepting break:', err);
    }
  }, []);

  // Dismiss break recommendation
  const dismissBreak = useCallback(async (recommendationId: string, reason: string) => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/fatigue/breaks/${recommendationId}/dismiss`,
        null,
        { params: { reason } }
      );

      setCurrentRecommendation(null);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to dismiss break');
      console.error('Error dismissing break:', err);
    }
  }, []);

  // Defer break recommendation
  const deferBreak = useCallback(async (recommendationId: string, minutes: number) => {
    // Dismiss current recommendation
    await dismissBreak(recommendationId, `Deferred for ${minutes} minutes`);

    // Set timeout to remind
    setTimeout(() => {
      // Show reminder (could trigger a notification)
      console.log(`Reminder: Break deferred ${minutes} minutes ago`);
    }, minutes * 60 * 1000);
  }, [dismissBreak]);

  // Complete break
  const completeBreak = useCallback(async (
    recommendationId: string,
    duration: number,
    activities: string[]
  ) => {
    try {
      await axios.put(`${API_BASE_URL}/api/fatigue/breaks/${recommendationId}/complete`, {
        actual_duration_minutes: duration,
        activities
      });

      setCurrentRecommendation(null);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to complete break');
      console.error('Error completing break:', err);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, [disconnectWebSocket]);

  return {
    fatigueState,
    currentRecommendation,
    isConnected,
    error,
    startSession,
    endSession,
    recordMetric,
    acceptBreak,
    dismissBreak,
    deferBreak,
    completeBreak
  };
};

export default useFatigueMonitoring;
