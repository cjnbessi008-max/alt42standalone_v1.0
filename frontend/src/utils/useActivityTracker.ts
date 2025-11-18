/**
 * Custom hook for tracking student activity during problem solving
 */
import { useEffect, useRef, useCallback } from 'react';
import { sessionAPI } from '../services/api';
import type { EventType } from '../types';

interface UseActivityTrackerOptions {
  sessionId: string;
  enabled?: boolean;
  pauseThreshold?: number; // milliseconds of inactivity to detect pause
}

export const useActivityTracker = ({
  sessionId,
  enabled = true,
  pauseThreshold = 3000,
}: UseActivityTrackerOptions) => {
  const startTime = useRef<number>(Date.now());
  const lastActivityTime = useRef<number>(Date.now());
  const pauseDetected = useRef<boolean>(false);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

  /**
   * Calculate time elapsed since session start
   */
  const getTimeSinceStart = useCallback((): number => {
    return Date.now() - startTime.current;
  }, []);

  /**
   * Track an event
   */
  const trackEvent = useCallback(
    async (eventType: EventType, eventData?: Record<string, any>) => {
      if (!enabled) return;

      const timeSinceStartMs = getTimeSinceStart();
      lastActivityTime.current = Date.now();

      // Reset pause detection
      if (pauseDetected.current) {
        pauseDetected.current = false;
        // Track resume event
        await sessionAPI.trackEvent(
          sessionId,
          'resume_detected',
          timeSinceStartMs,
          { previous_event: eventType }
        );
      }

      // Track the actual event
      try {
        await sessionAPI.trackEvent(sessionId, eventType, timeSinceStartMs, eventData);
      } catch (error) {
        console.error('Failed to track event:', error);
      }

      // Restart inactivity timer
      restartInactivityTimer();
    },
    [sessionId, enabled, getTimeSinceStart]
  );

  /**
   * Restart the inactivity detection timer
   */
  const restartInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }

    inactivityTimer.current = setTimeout(() => {
      if (!pauseDetected.current) {
        pauseDetected.current = true;
        const timeSinceStartMs = getTimeSinceStart();

        sessionAPI
          .trackEvent(sessionId, 'pause_detected', timeSinceStartMs, {
            pause_duration_estimate: pauseThreshold,
          })
          .catch((error) => console.error('Failed to track pause:', error));
      }
    }, pauseThreshold);
  }, [sessionId, pauseThreshold, getTimeSinceStart]);

  /**
   * Track input focus
   */
  const onInputFocus = useCallback(
    (inputId?: string) => {
      trackEvent('input_focus', { input_id: inputId });
    },
    [trackEvent]
  );

  /**
   * Track input blur
   */
  const onInputBlur = useCallback(
    (inputId?: string) => {
      trackEvent('input_blur', { input_id: inputId });
    },
    [trackEvent]
  );

  /**
   * Track input change
   */
  const onInputChange = useCallback(
    (inputId: string, value: any) => {
      trackEvent('input_change', { input_id: inputId, value });
    },
    [trackEvent]
  );

  /**
   * Track button click
   */
  const onButtonClick = useCallback(
    (buttonId: string, buttonLabel?: string) => {
      trackEvent('button_click', { button_id: buttonId, label: buttonLabel });
    },
    [trackEvent]
  );

  /**
   * Track hint request
   */
  const onHintRequest = useCallback(
    (hintId?: string) => {
      trackEvent('hint_requested', { hint_id: hintId });
    },
    [trackEvent]
  );

  /**
   * Track answer submission
   */
  const onAnswerSubmit = useCallback(
    (answer: any) => {
      trackEvent('answer_submitted', { answer });
    },
    [trackEvent]
  );

  /**
   * Track problem completion
   */
  const onProblemComplete = useCallback(
    (isCorrect: boolean) => {
      trackEvent('problem_completed', { is_correct: isCorrect });
    },
    [trackEvent]
  );

  /**
   * Initialize tracking on mount
   */
  useEffect(() => {
    if (enabled) {
      trackEvent('problem_start');
      restartInactivityTimer();
    }

    return () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, [enabled]); // Only run on mount/unmount

  return {
    trackEvent,
    onInputFocus,
    onInputBlur,
    onInputChange,
    onButtonClick,
    onHintRequest,
    onAnswerSubmit,
    onProblemComplete,
    getTimeSinceStart,
  };
};
