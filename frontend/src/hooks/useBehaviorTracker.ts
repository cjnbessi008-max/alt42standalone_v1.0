/**
 * Custom React hook for tracking student behavior
 *
 * This hook automatically tracks various user interactions and sends them
 * to the emotion detection API.
 */
import { useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { emotionApi } from '../services/emotionApi';
import { BehaviorEvent } from '../types/emotion';

interface BehaviorTrackerOptions {
  studentId: string;
  sessionId: string;
  moduleId: string;
  enabled?: boolean;
  trackClicks?: boolean;
  trackKeypress?: boolean;
  trackMouseMovement?: boolean;
  trackScrolling?: boolean;
  batchSize?: number;
  flushInterval?: number; // milliseconds
}

export const useBehaviorTracker = (options: BehaviorTrackerOptions) => {
  const {
    studentId,
    sessionId,
    moduleId,
    enabled = true,
    trackClicks = true,
    trackKeypress = true,
    trackMouseMovement = true,
    trackScrolling = true,
    batchSize = 10,
    flushInterval = 5000,
  } = options;

  const eventQueue = useRef<BehaviorEvent[]>([]);
  const lastEventTime = useRef<number>(Date.now());
  const mousePositions = useRef<Array<{ x: number; y: number; time: number }>>([]);

  /**
   * Flush events to API
   */
  const flushEvents = useCallback(async () => {
    if (eventQueue.current.length === 0) return;

    const events = [...eventQueue.current];
    eventQueue.current = [];

    // Send events to API
    for (const event of events) {
      await emotionApi.trackBehaviorEvent(event);
    }

    console.log(`[BehaviorTracker] Flushed ${events.length} events`);
  }, []);

  /**
   * Add event to queue
   */
  const addEvent = useCallback(
    (event: Omit<BehaviorEvent, 'student_id' | 'session_id' | 'module_id'>) => {
      if (!enabled) return;

      const now = Date.now();
      const timeSinceLastEvent = now - lastEventTime.current;

      const fullEvent: BehaviorEvent = {
        ...event,
        student_id: studentId,
        session_id: sessionId,
        module_id: moduleId,
        time_since_last_event_ms: timeSinceLastEvent,
      };

      eventQueue.current.push(fullEvent);
      lastEventTime.current = now;

      // Flush if batch size reached
      if (eventQueue.current.length >= batchSize) {
        flushEvents();
      }
    },
    [enabled, studentId, sessionId, moduleId, batchSize, flushEvents]
  );

  /**
   * Calculate mouse speed
   */
  const calculateMouseSpeed = useCallback(() => {
    if (mousePositions.current.length < 2) return 0;

    const recent = mousePositions.current.slice(-10); // Last 10 positions
    let totalDistance = 0;
    let totalTime = 0;

    for (let i = 1; i < recent.length; i++) {
      const dx = recent[i].x - recent[i - 1].x;
      const dy = recent[i].y - recent[i - 1].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const time = recent[i].time - recent[i - 1].time;

      totalDistance += distance;
      totalTime += time;
    }

    // Pixels per second
    return totalTime > 0 ? (totalDistance / totalTime) * 1000 : 0;
  }, []);

  /**
   * Track click events
   */
  useEffect(() => {
    if (!enabled || !trackClicks) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      addEvent({
        event_type: 'click',
        element_id: target.id || undefined,
        element_type: target.tagName?.toLowerCase(),
        event_data: {
          x: e.clientX,
          y: e.clientY,
          button: e.button,
        },
        mouse_speed: calculateMouseSpeed(),
      });
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [enabled, trackClicks, addEvent, calculateMouseSpeed]);

  /**
   * Track keypress events
   */
  useEffect(() => {
    if (!enabled || !trackKeypress) return;

    const keypressTimestamps = useRef<number[]>([]);

    const handleKeypress = (e: KeyboardEvent) => {
      const now = Date.now();
      keypressTimestamps.current.push(now);

      // Keep only last 60 seconds of keypresses
      keypressTimestamps.current = keypressTimestamps.current.filter(
        (time) => now - time < 60000
      );

      // Calculate characters per minute
      const charsPerMinute = keypressTimestamps.current.length;

      addEvent({
        event_type: 'keypress',
        keypress_speed: charsPerMinute,
        event_data: {
          key: e.key,
          code: e.code,
        },
      });
    };

    window.addEventListener('keypress', handleKeypress);
    return () => window.removeEventListener('keypress', handleKeypress);
  }, [enabled, trackKeypress, addEvent]);

  /**
   * Track mouse movement
   */
  useEffect(() => {
    if (!enabled || !trackMouseMovement) return;

    let mouseMoveTimeout: NodeJS.Timeout;

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      mousePositions.current.push({ x: e.clientX, y: e.clientY, time: now });

      // Keep only last 50 positions
      if (mousePositions.current.length > 50) {
        mousePositions.current.shift();
      }

      // Debounce mouse move events (send every 500ms)
      clearTimeout(mouseMoveTimeout);
      mouseMoveTimeout = setTimeout(() => {
        addEvent({
          event_type: 'mouse_move',
          mouse_speed: calculateMouseSpeed(),
          event_data: {
            x: e.clientX,
            y: e.clientY,
          },
        });
      }, 500);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(mouseMoveTimeout);
    };
  }, [enabled, trackMouseMovement, addEvent, calculateMouseSpeed]);

  /**
   * Track scroll events
   */
  useEffect(() => {
    if (!enabled || !trackScrolling) return;

    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        addEvent({
          event_type: 'scroll',
          event_data: {
            scrollY: window.scrollY,
            scrollX: window.scrollX,
          },
        });
      }, 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [enabled, trackScrolling, addEvent]);

  /**
   * Periodic flush interval
   */
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(flushEvents, flushInterval);
    return () => clearInterval(interval);
  }, [enabled, flushInterval, flushEvents]);

  /**
   * Flush on unmount
   */
  useEffect(() => {
    return () => {
      flushEvents();
    };
  }, [flushEvents]);

  return {
    trackEvent: addEvent,
    flushEvents,
  };
};
