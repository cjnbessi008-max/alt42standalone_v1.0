import { useEffect, useRef, useCallback } from 'react';
import { socketService } from '../services/socket';
import { trackingAPI } from '../services/api';
import type { BehaviorEvent } from '../types';

interface UseBehaviorTrackingProps {
  studentId: string;
  problemId: string;
  attemptId: string;
  enabled: boolean;
}

export function useBehaviorTracking({
  studentId,
  problemId,
  attemptId,
  enabled,
}: UseBehaviorTrackingProps) {
  const eventQueueRef = useRef<BehaviorEvent[]>([]);
  const lastActivityRef = useRef<number>(Date.now());
  const flushTimerRef = useRef<NodeJS.Timeout | null>(null);

  const trackEvent = useCallback(
    (eventType: BehaviorEvent['eventType'], eventData?: Record<string, any>) => {
      if (!enabled) return;

      const event: BehaviorEvent = {
        studentId,
        problemId,
        attemptId,
        eventType,
        eventData,
        timestamp: new Date().toISOString(),
      };

      // Add to queue
      eventQueueRef.current.push(event);
      lastActivityRef.current = Date.now();

      // Emit via socket for real-time detection
      socketService.trackBehavior(event);

      // Batch flush if queue is large enough
      if (eventQueueRef.current.length >= 10) {
        flushEvents();
      }
    },
    [studentId, problemId, attemptId, enabled]
  );

  const flushEvents = useCallback(async () => {
    if (eventQueueRef.current.length === 0) return;

    const eventsToSend = [...eventQueueRef.current];
    eventQueueRef.current = [];

    try {
      await trackingAPI.trackBatch(eventsToSend);
    } catch (error) {
      console.error('Failed to flush events:', error);
      // Re-add to queue on failure
      eventQueueRef.current.unshift(...eventsToSend);
    }
  }, []);

  // Auto-flush every 5 seconds
  useEffect(() => {
    if (!enabled) return;

    flushTimerRef.current = setInterval(() => {
      flushEvents();
    }, 5000);

    return () => {
      if (flushTimerRef.current) {
        clearInterval(flushTimerRef.current);
      }
      flushEvents();
    };
  }, [enabled, flushEvents]);

  // Track clicks
  useEffect(() => {
    if (!enabled) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      trackEvent('click', {
        target: target.id || target.className || target.tagName,
        x: e.clientX,
        y: e.clientY,
      });
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [enabled, trackEvent]);

  // Track focus/blur
  useEffect(() => {
    if (!enabled) return;

    const handleFocus = () => trackEvent('focus');
    const handleBlur = () => trackEvent('blur');

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [enabled, trackEvent]);

  return {
    trackEvent,
    flushEvents,
    getLastActivityTime: () => lastActivityRef.current,
  };
}
