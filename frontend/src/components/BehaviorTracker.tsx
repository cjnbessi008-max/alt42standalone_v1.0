/**
 * Behavior Tracker Component
 * Monitors user interactions and sends metrics to backend for emotion detection
 */

import React, { useEffect, useRef, ReactNode } from 'react';
import { BehaviorEvent } from '../types/emotion';

interface BehaviorTrackerProps {
  children: ReactNode;
  studentId: number;
  sessionId: string;
  apiBaseUrl?: string;
  batchSize?: number;
  batchIntervalMs?: number;
  enabled?: boolean;
  trackClicks?: boolean;
  trackKeyboard?: boolean;
  trackScroll?: boolean;
  trackFocus?: boolean;
  trackErrors?: boolean;
}

export const BehaviorTracker: React.FC<BehaviorTrackerProps> = ({
  children,
  studentId,
  sessionId,
  apiBaseUrl = '/api/v1',
  batchSize = 10,
  batchIntervalMs = 5000,
  enabled = true,
  trackClicks = true,
  trackKeyboard = true,
  trackScroll = true,
  trackFocus = true,
  trackErrors = true,
}) => {
  const lastInteractionRef = useRef<number>(Date.now());
  const metricsBufferRef = useRef<BehaviorEvent[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================================
  // Send Metrics to Backend
  // ============================================================================

  const sendMetricsToBackend = async (events: BehaviorEvent[]) => {
    if (events.length === 0) return;

    try {
      const response = await fetch(`${apiBaseUrl}/emotion/behavior/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId,
          session_id: sessionId,
          events,
        }),
      });

      if (!response.ok) {
        console.error('Failed to send behavior metrics:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending behavior metrics:', error);
    }
  };

  // ============================================================================
  // Track Interaction
  // ============================================================================

  const trackInteraction = (
    eventType: BehaviorEvent['event_type'],
    target: EventTarget | null,
    additionalData?: Partial<BehaviorEvent>
  ) => {
    if (!enabled) return;

    const now = Date.now();
    const timeSinceLastEvent = (now - lastInteractionRef.current) / 1000;

    const event: BehaviorEvent = {
      event_type: eventType,
      timestamp: new Date().toISOString(),
      time_since_last_event: timeSinceLastEvent,
      element_id: (target as HTMLElement)?.id || undefined,
      page_url: window.location.href,
      ...additionalData,
    };

    metricsBufferRef.current.push(event);
    lastInteractionRef.current = now;

    // Reset idle timeout
    resetIdleTimeout();

    // Send if buffer is full
    if (metricsBufferRef.current.length >= batchSize) {
      sendMetricsToBackend(metricsBufferRef.current);
      metricsBufferRef.current = [];
    }
  };

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleClick = (event: MouseEvent) => {
    if (!trackClicks) return;
    trackInteraction('click', event.target);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!trackKeyboard) return;

    // Check if it's a submit event (Enter key)
    if (event.key === 'Enter') {
      trackInteraction('submit', event.target);
    } else {
      trackInteraction('input', event.target);
    }
  };

  const handleScroll = () => {
    if (!trackScroll) return;

    // Debounce scroll events
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      trackInteraction('scroll', document.body);
    }, 300);
  };

  const handleFocus = (event: FocusEvent) => {
    if (!trackFocus) return;
    trackInteraction('focus', event.target);
  };

  const handleBlur = (event: FocusEvent) => {
    if (!trackFocus) return;
    trackInteraction('blur', event.target);
  };

  const handleError = (event: ErrorEvent) => {
    if (!trackErrors) return;

    trackInteraction('error', event.target, {
      is_error: true,
      metadata: {
        error_message: event.message,
        error_filename: event.filename,
        error_lineno: event.lineno,
        error_colno: event.colno,
      },
    });
  };

  // ============================================================================
  // Idle Detection
  // ============================================================================

  const resetIdleTimeout = () => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }

    // Set idle timeout for 30 seconds
    idleTimeoutRef.current = setTimeout(() => {
      trackInteraction('idle', null, {
        metadata: {
          idle_duration_seconds: 30,
        },
      });
    }, 30000);
  };

  // ============================================================================
  // Custom Event Tracking (for form errors, retries, etc.)
  // ============================================================================

  useEffect(() => {
    // Listen for custom events from other components
    const handleCustomError = (event: CustomEvent) => {
      trackInteraction('error', event.target, {
        is_error: true,
        retry_number: event.detail?.retry_number || 0,
        metadata: event.detail,
      });
    };

    const handleCustomSubmit = (event: CustomEvent) => {
      trackInteraction('submit', event.target, {
        task_id: event.detail?.task_id,
        metadata: event.detail,
      });
    };

    window.addEventListener('app:form:error', handleCustomError as EventListener);
    window.addEventListener('app:form:submit', handleCustomSubmit as EventListener);

    return () => {
      window.removeEventListener('app:form:error', handleCustomError as EventListener);
      window.removeEventListener('app:form:submit', handleCustomSubmit as EventListener);
    };
  }, [enabled, studentId, sessionId]);

  // ============================================================================
  // Setup Event Listeners
  // ============================================================================

  useEffect(() => {
    if (!enabled) return;

    // Add event listeners
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('focus', handleFocus, true);
    document.addEventListener('blur', handleBlur, true);
    window.addEventListener('error', handleError);

    // Start periodic batch sending
    intervalRef.current = setInterval(() => {
      if (metricsBufferRef.current.length > 0) {
        sendMetricsToBackend(metricsBufferRef.current);
        metricsBufferRef.current = [];
      }
    }, batchIntervalMs);

    // Initialize idle timeout
    resetIdleTimeout();

    // Cleanup
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('scroll', handleScroll);
      document.removeEventListener('focus', handleFocus, true);
      document.removeEventListener('blur', handleBlur, true);
      window.removeEventListener('error', handleError);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }

      // Send remaining metrics
      if (metricsBufferRef.current.length > 0) {
        sendMetricsToBackend(metricsBufferRef.current);
      }
    };
  }, [
    enabled,
    studentId,
    sessionId,
    apiBaseUrl,
    batchSize,
    batchIntervalMs,
    trackClicks,
    trackKeyboard,
    trackScroll,
    trackFocus,
    trackErrors,
  ]);

  // ============================================================================
  // Render
  // ============================================================================

  return <>{children}</>;
};

// ============================================================================
// Utility Functions for Manual Tracking
// ============================================================================

/**
 * Dispatch custom form error event
 * Use this when detecting form validation errors or submission failures
 */
export const trackFormError = (elementId: string, retryNumber: number = 0, metadata?: any) => {
  const event = new CustomEvent('app:form:error', {
    detail: {
      element_id: elementId,
      retry_number: retryNumber,
      ...metadata,
    },
  });
  window.dispatchEvent(event);
};

/**
 * Dispatch custom form submit event
 * Use this when a form or task is successfully submitted
 */
export const trackFormSubmit = (taskId?: number, metadata?: any) => {
  const event = new CustomEvent('app:form:submit', {
    detail: {
      task_id: taskId,
      ...metadata,
    },
  });
  window.dispatchEvent(event);
};

/**
 * Example usage in a form component:
 *
 * import { trackFormError, trackFormSubmit } from './BehaviorTracker';
 *
 * const handleSubmit = async (data) => {
 *   try {
 *     await submitForm(data);
 *     trackFormSubmit(taskId, { success: true });
 *   } catch (error) {
 *     trackFormError('form_input', retryCount, { error: error.message });
 *   }
 * };
 */
