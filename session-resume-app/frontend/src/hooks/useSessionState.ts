/**
 * useSessionState Hook - Manage session state with auto-save
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { debounce } from 'lodash';
import { sessionApi } from '../services/api';
import type { SessionState } from '../types';

interface UseSessionStateOptions {
  moduleId: string;
  studentId: string;
  autoSaveInterval?: number; // milliseconds, default 30000
}

interface UseSessionStateReturn {
  sessionState: SessionState | null;
  isRestored: boolean;
  isSaving: boolean;
  error: Error | null;
  updateSessionState: (updates: Partial<SessionState>) => void;
  completeSession: (finalScore?: number, totalTime?: number) => Promise<void>;
}

export const useSessionState = ({
  moduleId,
  studentId,
  autoSaveInterval = 30000,
}: UseSessionStateOptions): UseSessionStateReturn => {
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [isRestored, setIsRestored] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load or create session on mount
  useEffect(() => {
    if (isInitialized) return;

    const initSession = async () => {
      try {
        const response = await sessionApi.startSession(
          moduleId,
          studentId,
          false
        );

        setSessionState(response.session);
        setIsRestored(response.session.has_previous_session);
        setIsInitialized(true);
      } catch (err) {
        setError(err as Error);
        console.error('Failed to initialize session:', err);
      }
    };

    initSession();
  }, [moduleId, studentId, isInitialized]);

  // Auto-save session state
  const saveSession = useCallback(
    async (state: SessionState) => {
      if (!state.id) return;

      setIsSaving(true);
      setError(null);

      try {
        await sessionApi.updateSession(moduleId, state.id, {
          current_problem_id: state.current_problem_id || undefined,
          problem_index: state.problem_index,
          session_data: state.session_data,
          device_info: {
            user_agent: navigator.userAgent,
            device_type: getDeviceType(),
            timestamp: new Date().toISOString(),
          },
        });
      } catch (err) {
        console.error('Failed to save session:', err);
        setError(err as Error);

        // Fallback to localStorage
        try {
          localStorage.setItem(
            `session_${moduleId}_${studentId}`,
            JSON.stringify(state)
          );
          console.log('Session saved to localStorage as fallback');
        } catch (storageErr) {
          console.error('Failed to save to localStorage:', storageErr);
        }
      } finally {
        setIsSaving(false);
      }
    },
    [moduleId, studentId]
  );

  // Debounced auto-save
  const debouncedSave = useRef(
    debounce((state: SessionState) => {
      saveSession(state);
    }, autoSaveInterval)
  ).current;

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  // Update session state
  const updateSessionState = useCallback(
    (updates: Partial<SessionState>) => {
      setSessionState((prev) => {
        if (!prev) return null;
        const newState = { ...prev, ...updates };
        debouncedSave(newState);
        return newState;
      });
    },
    [debouncedSave]
  );

  // Complete session
  const completeSession = useCallback(
    async (finalScore?: number, totalTime?: number) => {
      if (!sessionState?.id) return;

      try {
        await sessionApi.completeSession(
          moduleId,
          sessionState.id,
          finalScore,
          totalTime
        );

        setSessionState((prev) =>
          prev
            ? { ...prev, is_completed: true, completed_at: new Date().toISOString() }
            : null
        );
      } catch (err) {
        setError(err as Error);
        console.error('Failed to complete session:', err);
      }
    },
    [moduleId, sessionState]
  );

  return {
    sessionState,
    isRestored,
    isSaving,
    error,
    updateSessionState,
    completeSession,
  };
};

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}
