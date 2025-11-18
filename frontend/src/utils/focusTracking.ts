/**
 * Focus tracking utility for monitoring user interactions
 */

export interface FocusEvent {
  type: 'click' | 'input' | 'focus' | 'blur' | 'scroll' | 'keydown' | 'mousemove';
  timestamp: number;
  pageUrl: string;
  componentName?: string;
  data?: Record<string, any>;
}

export class FocusTracker {
  private events: FocusEvent[] = [];
  private sessionId: number | null = null;
  private lastEventTime: number = Date.now();
  private isTracking: boolean = false;
  private idleThreshold: number = 60000; // 60 seconds
  private idleTimer: NodeJS.Timeout | null = null;
  private onEventCallback?: (event: FocusEvent) => void;
  private activeTime: number = 0;
  private idleTime: number = 0;
  private lastActiveTime: number = Date.now();
  private contextSwitches: number = 0;

  constructor(sessionId?: number, onEvent?: (event: FocusEvent) => void) {
    this.sessionId = sessionId || null;
    this.onEventCallback = onEvent;
  }

  /**
   * Start tracking focus events
   */
  start(): void {
    if (this.isTracking) return;

    this.isTracking = true;
    this.lastEventTime = Date.now();
    this.lastActiveTime = Date.now();

    // Add event listeners
    this.addEventListeners();

    // Start idle detection
    this.startIdleDetection();

    // Track visibility changes (context switches)
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * Stop tracking
   */
  stop(): void {
    if (!this.isTracking) return;

    this.isTracking = false;

    // Remove event listeners
    this.removeEventListeners();

    // Clear idle timer
    if (this.idleTimer) {
      clearInterval(this.idleTimer);
      this.idleTimer = null;
    }

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * Set session ID
   */
  setSessionId(sessionId: number): void {
    this.sessionId = sessionId;
  }

  /**
   * Add event listeners for tracking
   */
  private addEventListeners(): void {
    document.addEventListener('click', this.handleClick);
    document.addEventListener('keydown', this.handleKeydown);
    document.addEventListener('scroll', this.handleScroll, true);
    document.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('blur', this.handleBlur);
    window.addEventListener('focus', this.handleFocus);

    // Track input events
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('input', this.handleInput);
    });
  }

  /**
   * Remove event listeners
   */
  private removeEventListeners(): void {
    document.removeEventListener('click', this.handleClick);
    document.removeEventListener('keydown', this.handleKeydown);
    document.removeEventListener('scroll', this.handleScroll, true);
    document.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('focus', this.handleFocus);
  }

  /**
   * Record an event
   */
  private recordEvent(type: FocusEvent['type'], data?: Record<string, any>, componentName?: string): void {
    const now = Date.now();
    const timeSinceLastEvent = (now - this.lastEventTime) / 1000; // in seconds

    // Update active time
    if (timeSinceLastEvent < this.idleThreshold / 1000) {
      this.activeTime += timeSinceLastEvent;
    } else {
      this.idleTime += timeSinceLastEvent;
    }

    const event: FocusEvent = {
      type,
      timestamp: now,
      pageUrl: window.location.pathname,
      componentName,
      data,
    };

    this.events.push(event);
    this.lastEventTime = now;
    this.lastActiveTime = now;

    // Call callback if provided
    if (this.onEventCallback) {
      this.onEventCallback(event);
    }
  }

  /**
   * Event handlers
   */
  private handleClick = (e: MouseEvent): void => {
    const target = e.target as HTMLElement;
    this.recordEvent('click', {
      x: e.clientX,
      y: e.clientY,
      target: target.tagName,
    }, target.id || target.className);
  };

  private handleInput = (e: Event): void => {
    const target = e.target as HTMLInputElement;
    this.recordEvent('input', {
      inputType: target.type,
    }, target.name || target.id);
  };

  private handleKeydown = (e: KeyboardEvent): void => {
    this.recordEvent('keydown', {
      key: e.key,
    });
  };

  private handleScroll = (e: Event): void => {
    this.recordEvent('scroll', {
      scrollY: window.scrollY,
    });
  };

  private handleMouseMove = (e: MouseEvent): void => {
    // Throttle mousemove events (only record every 5 seconds)
    if (Date.now() - this.lastEventTime > 5000) {
      this.recordEvent('mousemove', {
        x: e.clientX,
        y: e.clientY,
      });
    }
  };

  private handleBlur = (): void => {
    this.recordEvent('blur');
  };

  private handleFocus = (): void => {
    this.recordEvent('focus');
  };

  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.contextSwitches++;
    }
  };

  /**
   * Start idle detection
   */
  private startIdleDetection(): void {
    this.idleTimer = setInterval(() => {
      const now = Date.now();
      const timeSinceLastEvent = now - this.lastEventTime;

      if (timeSinceLastEvent > this.idleThreshold) {
        // User is idle
        this.idleTime += (now - this.lastActiveTime) / 1000;
        this.lastActiveTime = now;
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    activeTime: number;
    idleTime: number;
    interactionCount: number;
    contextSwitches: number;
  } {
    return {
      activeTime: Math.round(this.activeTime),
      idleTime: Math.round(this.idleTime),
      interactionCount: this.events.length,
      contextSwitches: this.contextSwitches,
    };
  }

  /**
   * Get all events
   */
  getEvents(): FocusEvent[] {
    return this.events;
  }

  /**
   * Clear events
   */
  clearEvents(): void {
    this.events = [];
  }

  /**
   * Calculate focus score based on current session
   */
  calculateCurrentFocusScore(): number {
    const stats = this.getSessionStats();
    const totalTime = stats.activeTime + stats.idleTime;

    if (totalTime === 0) return 0;

    // Activity ratio (40% weight)
    const activityRatio = (stats.activeTime / totalTime) * 40;

    // Interaction density (30% weight)
    const interactionDensity = Math.min(30, (stats.interactionCount / (totalTime / 60)) * 10);

    // Idle penalty (20% weight)
    const idleRatio = stats.idleTime / totalTime;
    const idleScore = Math.max(0, 20 * (1 - idleRatio));

    // Context switch penalty (10% weight)
    const contextScore = Math.max(0, 10 - stats.contextSwitches * 2);

    return Math.min(100, activityRatio + interactionDensity + idleScore + contextScore);
  }
}

// Singleton instance
let trackerInstance: FocusTracker | null = null;

export const getFocusTracker = (sessionId?: number, onEvent?: (event: FocusEvent) => void): FocusTracker => {
  if (!trackerInstance) {
    trackerInstance = new FocusTracker(sessionId, onEvent);
  } else if (sessionId) {
    trackerInstance.setSessionId(sessionId);
  }
  return trackerInstance;
};
