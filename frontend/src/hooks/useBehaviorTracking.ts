/**
 * React Hook for Behavior Tracking
 *
 * Tracks student behavior (mouse movements, clicks, scrolls, focus)
 * and sends data to backend for mind wandering detection
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface BehaviorEvent {
  student_id: string;
  module_id: string;
  session_id: string;
  event_type: string;
  event_data?: Record<string, any>;
  mouse_x?: number;
  mouse_y?: number;
  scroll_x?: number;
  scroll_y?: number;
  time_since_last_event?: number;
  page_url?: string;
  page_title?: string;
}

interface UseBehaviorTrackingOptions {
  studentId: string;
  moduleId: string;
  sessionId?: string;
  apiUrl?: string;
  batchSize?: number;
  flushInterval?: number;
  trackMouseMove?: boolean;
  trackClicks?: boolean;
  trackScroll?: boolean;
  trackFocus?: boolean;
  onMindWanderingDetected?: (data: any) => void;
}

export const useBehaviorTracking = (options: UseBehaviorTrackingOptions) => {
  const {
    studentId,
    moduleId,
    sessionId: providedSessionId,
    apiUrl = 'http://localhost:8000/api/v1',
    batchSize = 50,
    flushInterval = 10000, // 10 seconds
    trackMouseMove = true,
    trackClicks = true,
    trackScroll = true,
    trackFocus = true,
    onMindWanderingDetected
  } = options;

  const [sessionId, setSessionId] = useState<string>(providedSessionId || '');
  const [isTracking, setIsTracking] = useState(false);
  const eventBufferRef = useRef<BehaviorEvent[]>([]);
  const lastEventTimeRef = useRef<number>(Date.now());
  const flushTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mouseMoveThrottleRef = useRef<NodeJS.Timeout | null>(null);

  // Start session
  const startSession = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/behavior/sessions/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          module_id: moduleId,
          user_agent: navigator.userAgent,
          device_type: getDeviceType(),
          browser: getBrowserName()
        })
      });

      const data = await response.json();
      if (data.success) {
        setSessionId(data.session_id);
        console.log('Behavior tracking session started:', data.session_id);
        return data.session_id;
      }
    } catch (error) {
      console.error('Failed to start tracking session:', error);
    }
    return null;
  }, [studentId, moduleId, apiUrl]);

  // End session
  const endSession = useCallback(async () => {
    if (!sessionId) return;

    // Flush remaining events
    await flushEvents();

    try {
      const response = await fetch(`${apiUrl}/behavior/sessions/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      });

      const data = await response.json();
      console.log('Behavior tracking session ended:', data);
      setIsTracking(false);
      return data;
    } catch (error) {
      console.error('Failed to end tracking session:', error);
    }
  }, [sessionId, apiUrl]);

  // Add event to buffer
  const addEvent = useCallback((
    eventType: string,
    eventData?: Record<string, any>,
    mouseX?: number,
    mouseY?: number,
    scrollX?: number,
    scrollY?: number
  ) => {
    if (!sessionId || !isTracking) return;

    const now = Date.now();
    const timeSinceLastEvent = (now - lastEventTimeRef.current) / 1000; // seconds

    const event: BehaviorEvent = {
      student_id: studentId,
      module_id: moduleId,
      session_id: sessionId,
      event_type: eventType,
      event_data: eventData,
      mouse_x: mouseX,
      mouse_y: mouseY,
      scroll_x: scrollX,
      scroll_y: scrollY,
      time_since_last_event: timeSinceLastEvent,
      page_url: window.location.href,
      page_title: document.title
    };

    eventBufferRef.current.push(event);
    lastEventTimeRef.current = now;

    // Flush if buffer is full
    if (eventBufferRef.current.length >= batchSize) {
      flushEvents();
    }
  }, [sessionId, studentId, moduleId, batchSize, isTracking]);

  // Flush events to backend
  const flushEvents = useCallback(async () => {
    if (eventBufferRef.current.length === 0) return;

    const eventsToSend = [...eventBufferRef.current];
    eventBufferRef.current = [];

    try {
      const response = await fetch(`${apiUrl}/behavior/events/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: eventsToSend })
      });

      if (!response.ok) {
        console.error('Failed to send behavior events:', response.statusText);
        // Re-add events to buffer on failure
        eventBufferRef.current = [...eventsToSend, ...eventBufferRef.current];
      }
    } catch (error) {
      console.error('Error sending behavior events:', error);
      // Re-add events to buffer on failure
      eventBufferRef.current = [...eventsToSend, ...eventBufferRef.current];
    }
  }, [apiUrl]);

  // Check for mind wandering
  const checkMindWandering = useCallback(async () => {
    if (!sessionId || !isTracking) return;

    try {
      const response = await fetch(
        `${apiUrl}/mind-wandering/detect/${studentId}/${sessionId}`
      );
      const data = await response.json();

      if (data.mind_wandering_detected && onMindWanderingDetected) {
        onMindWanderingDetected(data);
      }

      return data;
    } catch (error) {
      console.error('Error checking mind wandering:', error);
    }
  }, [sessionId, studentId, apiUrl, isTracking, onMindWanderingDetected]);

  // Event handlers
  const handleMouseMove = useCallback((e: MouseEvent) => {
    // Throttle mouse move events to avoid overwhelming the buffer
    if (mouseMoveThrottleRef.current) return;

    mouseMoveThrottleRef.current = setTimeout(() => {
      mouseMoveThrottleRef.current = null;
    }, 500); // Throttle to once per 500ms

    lastMousePositionRef.current = { x: e.clientX, y: e.clientY };
    addEvent('mouse_move', undefined, e.clientX, e.clientY);
  }, [addEvent]);

  const handleClick = useCallback((e: MouseEvent) => {
    addEvent('click', {
      button: e.button,
      target: (e.target as HTMLElement)?.tagName
    }, e.clientX, e.clientY);
  }, [addEvent]);

  const handleScroll = useCallback(() => {
    addEvent('scroll', undefined, undefined, undefined, window.scrollX, window.scrollY);
  }, [addEvent]);

  const handleFocus = useCallback(() => {
    addEvent('focus');
  }, [addEvent]);

  const handleBlur = useCallback(() => {
    addEvent('blur');
  }, [addEvent]);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      addEvent('page_hidden');
    } else {
      addEvent('page_visible');
    }
  }, [addEvent]);

  // Setup and cleanup
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const newSessionId = await startSession();
      if (newSessionId && mounted) {
        setIsTracking(true);
      }
    };

    init();

    return () => {
      mounted = false;
      if (isTracking) {
        endSession();
      }
    };
  }, []); // Run once on mount

  // Setup event listeners
  useEffect(() => {
    if (!isTracking) return;

    if (trackMouseMove) {
      document.addEventListener('mousemove', handleMouseMove);
    }
    if (trackClicks) {
      document.addEventListener('click', handleClick);
    }
    if (trackScroll) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }
    if (trackFocus) {
      window.addEventListener('focus', handleFocus);
      window.addEventListener('blur', handleBlur);
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    // Setup periodic flush
    flushTimerRef.current = setInterval(() => {
      flushEvents();
    }, flushInterval);

    return () => {
      if (trackMouseMove) {
        document.removeEventListener('mousemove', handleMouseMove);
      }
      if (trackClicks) {
        document.removeEventListener('click', handleClick);
      }
      if (trackScroll) {
        window.removeEventListener('scroll', handleScroll);
      }
      if (trackFocus) {
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('blur', handleBlur);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }

      if (flushTimerRef.current) {
        clearInterval(flushTimerRef.current);
      }
    };
  }, [
    isTracking,
    trackMouseMove,
    trackClicks,
    trackScroll,
    trackFocus,
    handleMouseMove,
    handleClick,
    handleScroll,
    handleFocus,
    handleBlur,
    handleVisibilityChange,
    flushInterval
  ]);

  return {
    sessionId,
    isTracking,
    startSession,
    endSession,
    checkMindWandering,
    flushEvents
  };
};

// Helper functions
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

function getBrowserName(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'firefox';
  if (ua.includes('Chrome')) return 'chrome';
  if (ua.includes('Safari')) return 'safari';
  if (ua.includes('Edge')) return 'edge';
  return 'unknown';
}
