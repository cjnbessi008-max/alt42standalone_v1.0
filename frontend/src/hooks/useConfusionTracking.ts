/**
 * Custom Hook for Confusion Tracking
 *
 * Manages real-time confusion level tracking and updates
 */

import { useState, useEffect, useCallback } from 'react';
import {
  StudentConfusionState,
  BehaviorMetrics,
  ConfusionEvent,
} from '../types/confusion';
import { confusionAPI } from '../services/api';
import { calculateConfusionLevel, categorizeConfusion, getConfusionColor } from '../services/confusionCalculator';

interface UseConfusionTrackingOptions {
  studentId: string;
  moduleId: string;
  enableRealtime?: boolean;
}

interface UseConfusionTrackingReturn {
  confusionState: StudentConfusionState | null;
  loading: boolean;
  error: Error | null;
  submitMetrics: (conceptId: string, metrics: BehaviorMetrics) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook to track and manage student confusion levels
 */
export function useConfusionTracking({
  studentId,
  moduleId,
  enableRealtime = false,
}: UseConfusionTrackingOptions): UseConfusionTrackingReturn {
  const [confusionState, setConfusionState] = useState<StudentConfusionState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch initial confusion state
  const fetchConfusionState = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const state = await confusionAPI.getStudentConfusion(studentId, moduleId);
      setConfusionState(state);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch confusion state:', err);
    } finally {
      setLoading(false);
    }
  }, [studentId, moduleId]);

  // Submit behavior metrics
  const submitMetrics = useCallback(
    async (conceptId: string, metrics: BehaviorMetrics) => {
      try {
        const updatedState = await confusionAPI.submitBehaviorMetrics(
          studentId,
          conceptId,
          metrics
        );
        setConfusionState(updatedState);
      } catch (err) {
        setError(err as Error);
        console.error('Failed to submit metrics:', err);
      }
    },
    [studentId]
  );

  // Real-time updates via WebSocket
  useEffect(() => {
    if (!enableRealtime) return;

    const ws = confusionAPI.subscribeToConfusionEvents(studentId, (event: ConfusionEvent) => {
      // Update state based on real-time event
      setConfusionState((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          overallConfusion: event.currentLevel,
          lastUpdated: event.timestamp,
          needsIntervention: event.eventType === 'HELP_NEEDED',
        };
      });
    });

    return () => {
      ws.close();
    };
  }, [studentId, enableRealtime]);

  // Initial load
  useEffect(() => {
    fetchConfusionState();
  }, [fetchConfusionState]);

  return {
    confusionState,
    loading,
    error,
    submitMetrics,
    refresh: fetchConfusionState,
  };
}

/**
 * Hook to track behavior metrics locally
 */
interface UseBehaviorTrackingReturn {
  metrics: BehaviorMetrics;
  startTracking: () => void;
  recordAttempt: (isCorrect: boolean) => void;
  recordHelpRequest: () => void;
  recordInputChange: () => void;
  resetMetrics: () => void;
  getMetrics: () => BehaviorMetrics;
}

export function useBehaviorTracking(): UseBehaviorTrackingReturn {
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [lastInteractionTime, setLastInteractionTime] = useState<Date | null>(null);
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [helpRequestCount, setHelpRequestCount] = useState<number>(0);
  const [inputChangeCount, setInputChangeCount] = useState<number>(0);
  const [mouseMovementScore, setMouseMovementScore] = useState<number>(0);

  // Start tracking session
  const startTracking = useCallback(() => {
    const now = new Date();
    setStartTime(now);
    setLastInteractionTime(now);
    setAttemptCount(0);
    setIsCorrect(false);
    setHelpRequestCount(0);
    setInputChangeCount(0);
    setMouseMovementScore(0);
  }, []);

  // Record an attempt
  const recordAttempt = useCallback((correct: boolean) => {
    setAttemptCount((prev) => prev + 1);
    setIsCorrect(correct);
    setLastInteractionTime(new Date());
  }, []);

  // Record help request
  const recordHelpRequest = useCallback(() => {
    setHelpRequestCount((prev) => prev + 1);
    setLastInteractionTime(new Date());
  }, []);

  // Record input change
  const recordInputChange = useCallback(() => {
    setInputChangeCount((prev) => prev + 1);
    setLastInteractionTime(new Date());
  }, []);

  // Get current metrics
  const getMetrics = useCallback((): BehaviorMetrics => {
    const now = new Date();
    const timeSpent = startTime ? (now.getTime() - startTime.getTime()) / 1000 : 0;
    const hesitationTime = lastInteractionTime
      ? (now.getTime() - lastInteractionTime.getTime()) / 1000
      : 0;

    return {
      timeSpent,
      attemptCount,
      isCorrect,
      hesitationTime,
      helpRequestCount,
      mouseMovementScore,
      inputChangeCount,
      timestamp: now,
    };
  }, [
    startTime,
    lastInteractionTime,
    attemptCount,
    isCorrect,
    helpRequestCount,
    mouseMovementScore,
    inputChangeCount,
  ]);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    setStartTime(null);
    setLastInteractionTime(null);
    setAttemptCount(0);
    setIsCorrect(false);
    setHelpRequestCount(0);
    setInputChangeCount(0);
    setMouseMovementScore(0);
  }, []);

  // Track mouse movement (simplified)
  useEffect(() => {
    let movements = 0;
    const handleMouseMove = () => {
      movements++;
      if (movements > 50) {
        setMouseMovementScore((prev) => Math.min(100, prev + 1));
        movements = 0;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return {
    metrics: getMetrics(),
    startTracking,
    recordAttempt,
    recordHelpRequest,
    recordInputChange,
    resetMetrics,
    getMetrics,
  };
}
