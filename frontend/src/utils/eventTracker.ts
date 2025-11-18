/**
 * Event Tracker Utility
 * Automatically tracks student interactions for DMN drift analysis
 */

import api from '../services/api';
import { EventType } from '../types';

class EventTracker {
  private sessionId: number | null = null;
  private studentId: number | null = null;
  private eventQueue: any[] = [];
  private batchInterval: NodeJS.Timeout | null = null;
  private lastActivityTime: number = Date.now();
  private idleCheckInterval: NodeJS.Timeout | null = null;
  private isIdle: boolean = false;
  private idleThreshold: number = 5000; // 5 seconds

  /**
   * Initialize event tracking for a session
   */
  initialize(sessionId: number, studentId: number) {
    this.sessionId = sessionId;
    this.studentId = studentId;
    this.setupListeners();
    this.startBatchSending();
    this.startIdleDetection();
  }

  /**
   * Cleanup and stop tracking
   */
  cleanup() {
    this.removeListeners();
    this.stopBatchSending();
    this.stopIdleDetection();
    this.flushQueue();
  }

  /**
   * Setup event listeners
   */
  private setupListeners() {
    // Click tracking
    document.addEventListener('click', this.handleClick);

    // Keypress tracking (throttled)
    document.addEventListener('keydown', this.handleKeypress);

    // Scroll tracking (throttled)
    document.addEventListener('scroll', this.throttle(this.handleScroll, 1000));

    // Focus/blur tracking
    window.addEventListener('blur', this.handleFocusLoss);
    window.addEventListener('focus', this.handleFocusGain);

    // Mouse movement (heavily throttled)
    document.addEventListener('mousemove', this.throttle(this.handleMouseMove, 2000));

    // Visibility change
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * Remove event listeners
   */
  private removeListeners() {
    document.removeEventListener('click', this.handleClick);
    document.removeEventListener('keydown', this.handleKeypress);
    document.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('blur', this.handleFocusLoss);
    window.removeEventListener('focus', this.handleFocusGain);
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * Track an event
   */
  private trackEvent(eventType: EventType, eventData?: Record<string, any>, responseTimeMs?: number) {
    if (!this.sessionId || !this.studentId) return;

    this.lastActivityTime = Date.now();

    // If was idle, mark end of idle period
    if (this.isIdle) {
      this.isIdle = false;
      this.eventQueue.push({
        session_id: this.sessionId,
        student_id: this.studentId,
        event_type: 'idle_end',
        event_data: { duration: Date.now() - this.lastActivityTime }
      });
    }

    this.eventQueue.push({
      session_id: this.sessionId,
      student_id: this.studentId,
      event_type: eventType,
      event_data: eventData,
      response_time_ms: responseTimeMs
    });
  }

  /**
   * Event handlers
   */
  private handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    this.trackEvent('click', {
      element: target.tagName,
      id: target.id || null,
      class: target.className || null,
      x: e.clientX,
      y: e.clientY
    });
  };

  private handleKeypress = (e: KeyboardEvent) => {
    this.trackEvent('keypress', {
      key: e.key,
      code: e.code
    });
  };

  private handleScroll = () => {
    this.trackEvent('scroll', {
      scrollY: window.scrollY,
      scrollX: window.scrollX
    });
  };

  private handleFocusLoss = () => {
    this.trackEvent('focus_loss');
  };

  private handleFocusGain = () => {
    this.trackEvent('focus_gain');
  };

  private handleMouseMove = (e: MouseEvent) => {
    this.trackEvent('mouse_move', {
      x: e.clientX,
      y: e.clientY
    });
  };

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.trackEvent('focus_loss', { reason: 'tab_hidden' });
    } else {
      this.trackEvent('focus_gain', { reason: 'tab_visible' });
    }
  };

  /**
   * Track answer submission (called externally)
   */
  public trackAnswerSubmit(problemId: string, isCorrect: boolean, responseTime: number) {
    this.trackEvent('answer_submit', {
      problem_id: problemId,
      is_correct: isCorrect,
      response_time_seconds: responseTime
    });
  }

  /**
   * Start batch sending of events
   */
  private startBatchSending() {
    this.batchInterval = setInterval(() => {
      this.flushQueue();
    }, 10000); // Send every 10 seconds
  }

  /**
   * Stop batch sending
   */
  private stopBatchSending() {
    if (this.batchInterval) {
      clearInterval(this.batchInterval);
      this.batchInterval = null;
    }
  }

  /**
   * Flush event queue to server
   */
  private async flushQueue() {
    if (this.eventQueue.length === 0) return;

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await api.trackBatchEvents(eventsToSend);
    } catch (error) {
      console.error('Failed to send events:', error);
      // Re-add failed events to queue (with limit)
      if (this.eventQueue.length < 100) {
        this.eventQueue.unshift(...eventsToSend);
      }
    }
  }

  /**
   * Start idle detection
   */
  private startIdleDetection() {
    this.idleCheckInterval = setInterval(() => {
      const idleTime = Date.now() - this.lastActivityTime;

      if (idleTime >= this.idleThreshold && !this.isIdle) {
        this.isIdle = true;
        this.trackEvent('idle_start', { duration: idleTime });
      }
    }, 1000); // Check every second
  }

  /**
   * Stop idle detection
   */
  private stopIdleDetection() {
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
      this.idleCheckInterval = null;
    }
  }

  /**
   * Throttle function
   */
  private throttle(func: Function, delay: number) {
    let lastCall = 0;
    return (...args: any[]) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  }
}

export default new EventTracker();
