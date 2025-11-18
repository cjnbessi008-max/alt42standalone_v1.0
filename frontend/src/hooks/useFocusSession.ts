/**
 * React hook for managing focus tracking sessions
 */
import { useState, useEffect, useCallback } from 'react';
import { getFocusTracker, FocusEvent } from '../utils/focusTracking';
import { sessionsApi } from '../services/api';
import type { FocusSession } from '../types';

export const useFocusSession = (moduleName?: string) => {
  const [session, setSession] = useState<FocusSession | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentFocusScore, setCurrentFocusScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const tracker = getFocusTracker();

  /**
   * Start a new focus session
   */
  const startSession = useCallback(async () => {
    try {
      const now = new Date();
      const dayOfWeek = (now.getDay() + 6) % 7; // Convert to Monday=0, Sunday=6
      const hourOfDay = now.getHours();

      const response = await sessionsApi.create({
        module_name: moduleName,
        day_of_week: dayOfWeek,
        hour_of_day: hourOfDay,
      });

      const newSession = response.data;
      setSession(newSession);

      // Start tracking with the new session ID
      tracker.setSessionId(newSession.id);
      tracker.start();
      setIsTracking(true);

      // Update focus score periodically
      const scoreInterval = setInterval(() => {
        const score = tracker.calculateCurrentFocusScore();
        setCurrentFocusScore(score);
      }, 5000); // Update every 5 seconds

      // Store interval ID for cleanup
      (window as any).__focusScoreInterval = scoreInterval;

    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to start session');
      console.error('Error starting session:', err);
    }
  }, [moduleName, tracker]);

  /**
   * End the current focus session
   */
  const endSession = useCallback(async () => {
    if (!session) return;

    try {
      // Stop tracking
      tracker.stop();
      setIsTracking(false);

      // Clear score update interval
      if ((window as any).__focusScoreInterval) {
        clearInterval((window as any).__focusScoreInterval);
      }

      // Get session statistics
      const stats = tracker.getSessionStats();

      // Update session
      await sessionsApi.update(session.id, {
        session_end: new Date().toISOString(),
        active_time_seconds: stats.activeTime,
        idle_time_seconds: stats.idleTime,
        interaction_count: stats.interactionCount,
        context_switches: stats.contextSwitches,
      });

      // Analyze session to calculate final scores
      const analysisResponse = await sessionsApi.analyze(session.id);
      console.log('Session analysis:', analysisResponse.data);

      // Clear tracker events
      tracker.clearEvents();
      setSession(null);

    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to end session');
      console.error('Error ending session:', err);
    }
  }, [session, tracker]);

  /**
   * Send focus metric to backend
   */
  const sendMetric = useCallback(async (event: FocusEvent) => {
    if (!session) return;

    try {
      await sessionsApi.createMetric(session.id, {
        session_id: session.id,
        event_type: event.type,
        event_data: event.data,
        time_since_last_event_seconds: 0, // Will be calculated by backend
        page_url: event.pageUrl,
        component_name: event.componentName,
      });
    } catch (err: any) {
      console.error('Error sending metric:', err);
    }
  }, [session]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (isTracking) {
        endSession();
      }
    };
  }, [isTracking, endSession]);

  return {
    session,
    isTracking,
    currentFocusScore,
    error,
    startSession,
    endSession,
    sendMetric,
  };
};
