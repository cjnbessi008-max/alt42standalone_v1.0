/**
 * Custom Hook for LMS Integration
 *
 * Handles LMS connection, data synchronization, and grade reporting
 */

import { useState, useEffect, useCallback } from 'react';
import { lmsAPI } from '../services/api';
import { LMSIntegrationData } from '../types/confusion';

interface UseLMSIntegrationOptions {
  lmsData: LMSIntegrationData;
  autoSync?: boolean;
}

interface UseLMSIntegrationReturn {
  sessionId: string | null;
  connected: boolean;
  loading: boolean;
  error: Error | null;
  syncStudents: () => Promise<void>;
  sendProgress: (studentId: string, activityId: string, score: number, completed: boolean) => Promise<void>;
  disconnect: () => void;
}

/**
 * Hook to manage LMS integration
 */
export function useLMSIntegration({
  lmsData,
  autoSync = false,
}: UseLMSIntegrationOptions): UseLMSIntegrationReturn {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize LMS session
  const initializeSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await lmsAPI.initializeLMSSession(lmsData);
      setSessionId(response.sessionId);
      setConnected(true);

      // Store session in localStorage
      localStorage.setItem('lms_session_id', response.sessionId);
      localStorage.setItem('lms_platform', lmsData.platform);
    } catch (err) {
      setError(err as Error);
      setConnected(false);
      console.error('Failed to initialize LMS session:', err);
    } finally {
      setLoading(false);
    }
  }, [lmsData]);

  // Sync student data from LMS
  const syncStudents = useCallback(async () => {
    if (!connected) {
      console.warn('Cannot sync: Not connected to LMS');
      return;
    }

    try {
      setLoading(true);
      await lmsAPI.syncStudentData(lmsData.courseId);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to sync student data:', err);
    } finally {
      setLoading(false);
    }
  }, [connected, lmsData.courseId]);

  // Send progress back to LMS
  const sendProgress = useCallback(
    async (studentId: string, activityId: string, score: number, completed: boolean) => {
      if (!connected) {
        console.warn('Cannot send progress: Not connected to LMS');
        return;
      }

      try {
        await lmsAPI.sendProgressToLMS(studentId, activityId, score, completed);
      } catch (err) {
        setError(err as Error);
        console.error('Failed to send progress to LMS:', err);
      }
    },
    [connected]
  );

  // Disconnect from LMS
  const disconnect = useCallback(() => {
    setConnected(false);
    setSessionId(null);
    localStorage.removeItem('lms_session_id');
    localStorage.removeItem('lms_platform');
  }, []);

  // Initialize on mount
  useEffect(() => {
    // Check for existing session
    const existingSessionId = localStorage.getItem('lms_session_id');
    if (existingSessionId) {
      setSessionId(existingSessionId);
      setConnected(true);
      setLoading(false);
    } else {
      initializeSession();
    }
  }, [initializeSession]);

  // Auto-sync if enabled
  useEffect(() => {
    if (autoSync && connected) {
      syncStudents();
    }
  }, [autoSync, connected, syncStudents]);

  return {
    sessionId,
    connected,
    loading,
    error,
    syncStudents,
    sendProgress,
    disconnect,
  };
}

/**
 * Hook to parse LTI launch data
 */
export function useLTILaunch(): LMSIntegrationData | null {
  const [ltiData, setLtiData] = useState<LMSIntegrationData | null>(null);

  useEffect(() => {
    // Parse URL parameters for LTI launch
    const params = new URLSearchParams(window.location.search);

    const platform = params.get('lms_platform') || 'Canvas';
    const courseId = params.get('context_id') || params.get('course_id') || '';
    const activityId = params.get('resource_link_id') || '';
    const lmsUserId = params.get('user_id') || '';

    if (courseId && activityId && lmsUserId) {
      const integrationData: LMSIntegrationData = {
        platform,
        courseId,
        activityId,
        lmsUserId,
        ltiData: Object.fromEntries(params.entries()),
      };

      setLtiData(integrationData);
    }
  }, []);

  return ltiData;
}
