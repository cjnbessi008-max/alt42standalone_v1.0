/**
 * Hook for tracking user behavior
 */

import { useEffect, useRef } from 'react';
import { socketService } from '../services/socketService';
import type { BehaviorEvent, BehaviorEventType } from '../../../shared/types';

export function useBehaviorTracking(studentId: string, activityId: string | null) {
  const eventBuffer = useRef<BehaviorEvent[]>([]);
  const flushInterval = useRef<NodeJS.Timeout | null>(null);

  const trackEvent = (eventType: BehaviorEventType, eventData: Record<string, any> = {}) => {
    if (!activityId) return;

    const event: BehaviorEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      studentId,
      activityId,
      eventType,
      eventData,
      timestamp: new Date()
    };

    eventBuffer.current.push(event);

    // Auto-flush if buffer gets too large
    if (eventBuffer.current.length >= 10) {
      flushEvents();
    }
  };

  const flushEvents = () => {
    if (eventBuffer.current.length === 0 || !activityId) return;

    socketService.trackBehavior({
      studentId,
      activityId,
      events: [...eventBuffer.current]
    });

    eventBuffer.current = [];
  };

  useEffect(() => {
    // Set up periodic flush
    flushInterval.current = setInterval(() => {
      flushEvents();
    }, 5000); // Flush every 5 seconds

    // Track page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackEvent('pause', { reason: 'tab_hidden' });
      } else {
        trackEvent('resume', { reason: 'tab_visible' });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (flushInterval.current) {
        clearInterval(flushInterval.current);
      }
      flushEvents(); // Flush remaining events
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [studentId, activityId]);

  return { trackEvent, flushEvents };
}
