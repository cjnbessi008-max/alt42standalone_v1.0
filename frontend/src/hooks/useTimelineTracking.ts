import { useRef, useCallback, useEffect } from 'react';
import { EventType, TimelineEvent } from '../types/timeline';
import { timelineApi } from '../services/api';

interface UseTimelineTrackingOptions {
  studentId: string;
  moduleId: string;
  problemId: string;
  batchSize?: number;
  batchInterval?: number;
}

interface UseTimelineTrackingReturn {
  sessionId: string;
  trackEvent: (eventType: EventType, eventData: Record<string, any>) => void;
  flush: () => Promise<void>;
}

/**
 * Hook for tracking student timeline events
 *
 * Features:
 * - Automatic batch recording to reduce API calls
 * - Sequential event numbering
 * - Automatic session ID generation
 * - Client-side timestamp recording
 * - Automatic flush on unmount
 *
 * @example
 * const { trackEvent } = useTimelineTracking({
 *   studentId: 'student-123',
 *   moduleId: 'module-456',
 *   problemId: 'problem-789'
 * });
 *
 * // Track an event
 * trackEvent('input_changed', {
 *   field: 'numerator',
 *   previous_value: '3',
 *   new_value: '5'
 * });
 */
export function useTimelineTracking({
  studentId,
  moduleId,
  problemId,
  batchSize = 10,
  batchInterval = 5000 // 5 seconds
}: UseTimelineTrackingOptions): UseTimelineTrackingReturn {
  const sessionIdRef = useRef<string>(generateSessionId());
  const sequenceNumberRef = useRef<number>(0);
  const eventBufferRef = useRef<TimelineEvent[]>([]);
  const flushTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastEventTimeRef = useRef<Date>(new Date());

  /**
   * Generate a unique session ID
   */
  function generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Flush buffered events to the server
   */
  const flush = useCallback(async () => {
    if (eventBufferRef.current.length === 0) return;

    const eventsToSend = [...eventBufferRef.current];
    eventBufferRef.current = [];

    try {
      if (eventsToSend.length === 1) {
        await timelineApi.recordEvent(eventsToSend[0]);
      } else {
        await timelineApi.recordEventsBatch(eventsToSend);
      }
    } catch (error) {
      console.error('Failed to record timeline events:', error);
      // Re-add events to buffer for retry (optional)
      // eventBufferRef.current.unshift(...eventsToSend);
    }
  }, []);

  /**
   * Schedule automatic flush
   */
  const scheduleFlush = useCallback(() => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
    }

    flushTimerRef.current = setTimeout(() => {
      flush();
    }, batchInterval);
  }, [flush, batchInterval]);

  /**
   * Track a timeline event
   */
  const trackEvent = useCallback(
    (eventType: EventType, eventData: Record<string, any>) => {
      sequenceNumberRef.current += 1;
      const now = new Date();
      const timeSinceLastEvent = now.getTime() - lastEventTimeRef.current.getTime();
      lastEventTimeRef.current = now;

      const event: TimelineEvent = {
        student_id: studentId,
        module_id: moduleId,
        problem_id: problemId,
        session_id: sessionIdRef.current,
        event_type: eventType,
        event_data: {
          ...eventData,
          time_since_last_event: timeSinceLastEvent
        },
        sequence_number: sequenceNumberRef.current,
        client_timestamp: now
      };

      eventBufferRef.current.push(event);

      // Flush immediately if batch size reached
      if (eventBufferRef.current.length >= batchSize) {
        flush();
      } else {
        scheduleFlush();
      }
    },
    [studentId, moduleId, problemId, batchSize, flush, scheduleFlush]
  );

  // Track session start on mount
  useEffect(() => {
    trackEvent('problem_started', {
      problem_id: problemId,
      timestamp: new Date().toISOString()
    });

    // Flush on unmount
    return () => {
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
      }
      // Synchronous flush for cleanup (best effort)
      if (eventBufferRef.current.length > 0) {
        flush();
      }
    };
  }, [problemId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track visibility changes (pause/resume)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackEvent('session_paused', {
          timestamp: new Date().toISOString()
        });
        flush(); // Flush immediately when pausing
      } else {
        trackEvent('session_resumed', {
          timestamp: new Date().toISOString()
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [trackEvent, flush]);

  // Flush on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (eventBufferRef.current.length > 0) {
        // Use sendBeacon for reliable delivery on page unload
        const data = JSON.stringify({
          events: eventBufferRef.current
        });

        navigator.sendBeacon(
          `${import.meta.env.VITE_API_URL}/api/timeline/events/batch`,
          new Blob([data], { type: 'application/json' })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return {
    sessionId: sessionIdRef.current,
    trackEvent,
    flush
  };
}
