import { useState, useCallback } from 'react';
import { warningApi } from '../services/api';
import type { CheckWarningRequest, TriggeredWarning } from '../types';

export const useConceptWarnings = (studentId: string) => {
  const [activeWarnings, setActiveWarnings] = useState<TriggeredWarning[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkWarnings = useCallback(async (
    inputText: string,
    activityType: string,
    options?: {
      moduleId?: string;
      sessionId?: string;
      problemData?: Record<string, any>;
      language?: 'en' | 'kr';
    }
  ) => {
    setIsChecking(true);
    setError(null);

    try {
      const request: CheckWarningRequest = {
        studentId,
        inputText,
        activityType,
        ...options
      };

      const response = await warningApi.check(request);

      if (response.shouldShowWarning && response.warningsTriggered.length > 0) {
        setActiveWarnings(prev => [...prev, ...response.warningsTriggered]);
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check warnings';
      setError(errorMessage);
      throw err;
    } finally {
      setIsChecking(false);
    }
  }, [studentId]);

  const acknowledgeWarning = useCallback(async (warningId: string) => {
    try {
      await warningApi.acknowledge(warningId, studentId, true, false);

      // Remove from active warnings
      setActiveWarnings(prev => prev.filter(w => w.warningId !== warningId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to acknowledge warning';
      setError(errorMessage);
      throw err;
    }
  }, [studentId]);

  const dismissWarning = useCallback(async (warningId: string) => {
    try {
      await warningApi.acknowledge(warningId, studentId, false, true);

      // Remove from active warnings
      setActiveWarnings(prev => prev.filter(w => w.warningId !== warningId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to dismiss warning';
      setError(errorMessage);
      throw err;
    }
  }, [studentId]);

  const clearWarnings = useCallback(() => {
    setActiveWarnings([]);
  }, []);

  return {
    activeWarnings,
    isChecking,
    error,
    checkWarnings,
    acknowledgeWarning,
    dismissWarning,
    clearWarnings
  };
};

export default useConceptWarnings;
