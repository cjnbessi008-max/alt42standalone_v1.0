/**
 * useDMNMonitoring Hook
 * Monitors student activity and manages DMN detection state
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface ActivityEvent {
  student_id: string;
  session_id: string;
  module_id?: string;
  event_type: 'click' | 'submit' | 'scroll' | 'focus_loss' | 'idle' | 'navigation' | 'error';
  timestamp?: string;
  response_time_ms?: number;
  is_correct?: boolean;
  content_position?: number;
  idle_duration_seconds?: number;
  window_focus_status?: boolean;
  metadata?: Record<string, any>;
}

interface BreakRecommendation {
  recommendation_id: string;
  break_type: string;
  duration_minutes: number;
  urgency_level: string;
  activities: any[];
  motivational_message: string;
  return_time: string;
  tips?: string[];
}

interface DMNStatus {
  student_id: string;
  dmn_score: number | null;
  fatigue_level: string | null;
  last_activity: string | null;
  session_duration_minutes: number | null;
  breaks_taken: number;
  recommendation: BreakRecommendation | null;
}

interface UseDMNMonitoringOptions {
  studentId: string;
  sessionId: string;
  moduleId?: string;
  enabled?: boolean;
  checkInterval?: number; // milliseconds
}

interface UseDMNMonitoringReturn {
  trackActivity: (event: Partial<ActivityEvent>) => Promise<void>;
  currentStatus: DMNStatus | null;
  currentRecommendation: BreakRecommendation | null;
  acceptBreak: (recommendationId: string) => Promise<void>;
  deferBreak: (recommendationId: string, deferMinutes: number) => Promise<void>;
  dismissBreak: (recommendationId: string) => Promise<void>;
  completeBreak: (data: {
    recommendationId: string;
    actualDurationMinutes: number;
    effectivenessRating: number;
    feedback?: string;
  }) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const useDMNMonitoring = ({
  studentId,
  sessionId,
  moduleId,
  enabled = true,
  checkInterval = 30000, // 30 seconds
}: UseDMNMonitoringOptions): UseDMNMonitoringReturn => {
  const [currentStatus, setCurrentStatus] = useState<DMNStatus | null>(null);
  const [currentRecommendation, setCurrentRecommendation] = useState<BreakRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activityBuffer = useRef<Partial<ActivityEvent>[]>([]);
  const lastActivityTime = useRef<number>(Date.now());
  const idleCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Track activity event
  const trackActivity = useCallback(async (event: Partial<ActivityEvent>) => {
    try {
      const activityEvent: ActivityEvent = {
        student_id: studentId,
        session_id: sessionId,
        module_id: moduleId,
        event_type: event.event_type || 'click',
        timestamp: new Date().toISOString(),
        ...event,
      };

      // Buffer activities for batch sending
      activityBuffer.current.push(activityEvent);
      lastActivityTime.current = Date.now();

      // Send if buffer is large enough
      if (activityBuffer.current.length >= 5) {
        await flushActivityBuffer();
      }

      setError(null);
    } catch (err) {
      console.error('Error tracking activity:', err);
      setError('Failed to track activity');
    }
  }, [studentId, sessionId, moduleId]);

  // Flush activity buffer
  const flushActivityBuffer = useCallback(async () => {
    if (activityBuffer.current.length === 0) return;

    try {
      const events = [...activityBuffer.current];
      activityBuffer.current = [];

      await axios.post(`${API_BASE_URL}/api/v1/dmn/activity/batch`, events);
    } catch (err) {
      console.error('Error flushing activity buffer:', err);
      // Put events back in buffer
      activityBuffer.current = [...activityBuffer.current, ...activityBuffer.current];
    }
  }, []);

  // Check for idle state
  const checkIdleState = useCallback(() => {
    const timeSinceLastActivity = Date.now() - lastActivityTime.current;
    const IDLE_THRESHOLD = 30000; // 30 seconds

    if (timeSinceLastActivity >= IDLE_THRESHOLD) {
      trackActivity({
        event_type: 'idle',
        idle_duration_seconds: Math.floor(timeSinceLastActivity / 1000),
      });
    }
  }, [trackActivity]);

  // Fetch DMN status
  const fetchDMNStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/v1/dmn/status/${studentId}`);
      setCurrentStatus(response.data);

      // Check if there's a new recommendation
      if (response.data.recommendation) {
        setCurrentRecommendation(response.data.recommendation);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching DMN status:', err);
      setError('Failed to fetch DMN status');
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  // Accept break
  const acceptBreak = useCallback(async (recommendationId: string) => {
    try {
      await axios.post(`${API_BASE_URL}/api/v1/dmn/break/acknowledge`, {
        recommendation_id: recommendationId,
        student_id: studentId,
        action: 'accept',
      });
      setError(null);
    } catch (err) {
      console.error('Error accepting break:', err);
      setError('Failed to accept break');
      throw err;
    }
  }, [studentId]);

  // Defer break
  const deferBreak = useCallback(async (recommendationId: string, deferMinutes: number) => {
    try {
      await axios.post(`${API_BASE_URL}/api/v1/dmn/break/acknowledge`, {
        recommendation_id: recommendationId,
        student_id: studentId,
        action: 'defer',
        defer_minutes: deferMinutes,
      });
      setCurrentRecommendation(null);
      setError(null);
    } catch (err) {
      console.error('Error deferring break:', err);
      setError('Failed to defer break');
      throw err;
    }
  }, [studentId]);

  // Dismiss break
  const dismissBreak = useCallback(async (recommendationId: string) => {
    try {
      await axios.post(`${API_BASE_URL}/api/v1/dmn/break/acknowledge`, {
        recommendation_id: recommendationId,
        student_id: studentId,
        action: 'dismiss',
      });
      setCurrentRecommendation(null);
      setError(null);
    } catch (err) {
      console.error('Error dismissing break:', err);
      setError('Failed to dismiss break');
      throw err;
    }
  }, [studentId]);

  // Complete break
  const completeBreak = useCallback(async (data: {
    recommendationId: string;
    actualDurationMinutes: number;
    effectivenessRating: number;
    feedback?: string;
  }) => {
    try {
      await axios.post(`${API_BASE_URL}/api/v1/dmn/break/complete`, {
        recommendation_id: data.recommendationId,
        student_id: studentId,
        actual_duration_minutes: data.actualDurationMinutes,
        effectiveness_rating: data.effectivenessRating,
        feedback: data.feedback,
      });
      setCurrentRecommendation(null);
      setError(null);

      // Refresh status after break
      await fetchDMNStatus();
    } catch (err) {
      console.error('Error completing break:', err);
      setError('Failed to complete break');
      throw err;
    }
  }, [studentId, fetchDMNStatus]);

  // Setup monitoring
  useEffect(() => {
    if (!enabled) return;

    // Initial status check
    fetchDMNStatus();

    // Periodic status checks
    statusCheckInterval.current = setInterval(fetchDMNStatus, checkInterval);

    // Idle state monitoring
    idleCheckInterval.current = setInterval(checkIdleState, 10000); // Check every 10 seconds

    // Flush activity buffer on unmount
    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
      if (idleCheckInterval.current) {
        clearInterval(idleCheckInterval.current);
      }
      flushActivityBuffer();
    };
  }, [enabled, fetchDMNStatus, checkIdleState, flushActivityBuffer, checkInterval]);

  // Track window focus/blur
  useEffect(() => {
    if (!enabled) return;

    const handleFocus = () => {
      trackActivity({
        event_type: 'click',
        window_focus_status: true,
      });
    };

    const handleBlur = () => {
      trackActivity({
        event_type: 'focus_loss',
        window_focus_status: false,
      });
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [enabled, trackActivity]);

  // Track page visibility
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackActivity({
          event_type: 'focus_loss',
        });
      } else {
        trackActivity({
          event_type: 'click',
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, trackActivity]);

  return {
    trackActivity,
    currentStatus,
    currentRecommendation,
    acceptBreak,
    deferBreak,
    dismissBreak,
    completeBreak,
    isLoading,
    error,
  };
};

export default useDMNMonitoring;
