/**
 * DistractionTracker - Client-side library for detecting and tracking student distractions
 *
 * This library monitors various distraction signals during learning sessions:
 * - Page blur (window focus loss)
 * - Tab switching
 * - Mouse inactivity
 * - Keyboard inactivity
 * - Combined inactivity
 * - Window resizing
 * - Copy/paste events
 * - Developer tools opening
 *
 * Usage:
 * ```typescript
 * const tracker = new DistractionTracker({
 *   studentId: 'uuid',
 *   moduleId: 'uuid',
 *   sessionId: 'uuid',
 *   apiEndpoint: '/api/modules/{moduleId}/distraction-events',
 *   onEventDetected: (event) => console.log('Distraction detected:', event)
 * });
 *
 * tracker.start();
 * // ... later
 * tracker.stop();
 * ```
 */

export interface DistractionEvent {
  studentId: string;
  moduleId: string;
  sessionId: string;
  problemId?: string;
  eventType: DistractionEventType;
  severityLevel: SeverityLevel;
  durationSeconds: number;
  metadata: Record<string, any>;
  problemContext: Record<string, any>;
  eventTimestamp: Date;
}

export type DistractionEventType =
  | 'page_blur'
  | 'tab_switch'
  | 'mouse_idle'
  | 'keyboard_idle'
  | 'inactivity'
  | 'window_resize'
  | 'copy_paste'
  | 'context_menu'
  | 'devtools_open';

export type SeverityLevel = 'minor' | 'moderate' | 'major' | 'critical';

export interface DistractionTrackerConfig {
  studentId: string;
  moduleId: string;
  sessionId: string;
  apiEndpoint: string;

  // Optional configuration
  problemId?: string;
  problemContext?: Record<string, any>;

  // Thresholds (in milliseconds)
  mouseIdleThreshold?: number;
  keyboardIdleThreshold?: number;
  inactivityThreshold?: number;

  // Callbacks
  onEventDetected?: (event: DistractionEvent) => void;
  onEventSent?: (event: DistractionEvent) => void;
  onError?: (error: Error) => void;

  // Batching configuration
  enableBatching?: boolean;
  batchSize?: number;
  batchInterval?: number;

  // Debug mode
  debug?: boolean;
}

export class DistractionTracker {
  private config: Required<DistractionTrackerConfig>;
  private isTracking = false;
  private eventQueue: DistractionEvent[] = [];
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private lastActivityTime = Date.now();
  private pageBlurStartTime: number | null = null;
  private lastMouseMoveTime = Date.now();
  private lastKeyPressTime = Date.now();
  private batchTimer: NodeJS.Timeout | null = null;

  constructor(config: DistractionTrackerConfig) {
    // Set defaults
    this.config = {
      ...config,
      mouseIdleThreshold: config.mouseIdleThreshold ?? 30000, // 30 seconds
      keyboardIdleThreshold: config.keyboardIdleThreshold ?? 30000, // 30 seconds
      inactivityThreshold: config.inactivityThreshold ?? 60000, // 60 seconds
      problemContext: config.problemContext ?? {},
      onEventDetected: config.onEventDetected ?? (() => {}),
      onEventSent: config.onEventSent ?? (() => {}),
      onError: config.onError ?? ((err) => console.error('DistractionTracker error:', err)),
      enableBatching: config.enableBatching ?? true,
      batchSize: config.batchSize ?? 10,
      batchInterval: config.batchInterval ?? 5000, // 5 seconds
      debug: config.debug ?? false,
    };
  }

  /**
   * Start tracking distractions
   */
  public start(): void {
    if (this.isTracking) {
      this.log('Tracker already started');
      return;
    }

    this.isTracking = true;
    this.lastActivityTime = Date.now();
    this.lastMouseMoveTime = Date.now();
    this.lastKeyPressTime = Date.now();

    this.attachEventListeners();
    this.startInactivityMonitoring();

    if (this.config.enableBatching) {
      this.startBatchProcessing();
    }

    this.log('Tracker started');
  }

  /**
   * Stop tracking distractions
   */
  public stop(): void {
    if (!this.isTracking) {
      return;
    }

    this.isTracking = false;
    this.detachEventListeners();
    this.stopInactivityMonitoring();

    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }

    // Flush remaining events
    this.flushEventQueue();

    this.log('Tracker stopped');
  }

  /**
   * Update current problem context
   */
  public updateProblemContext(problemId: string, context: Record<string, any>): void {
    this.config.problemId = problemId;
    this.config.problemContext = context;
  }

  /**
   * Manually record a distraction event
   */
  public recordEvent(eventType: DistractionEventType, durationSeconds: number, metadata: Record<string, any> = {}): void {
    const event = this.createEvent(eventType, durationSeconds, metadata);
    this.handleEvent(event);
  }

  // ============================================================================
  // Private Methods - Event Listeners
  // ============================================================================

  private attachEventListeners(): void {
    // Page blur (window focus loss)
    window.addEventListener('blur', this.onPageBlur);
    window.addEventListener('focus', this.onPageFocus);

    // Tab visibility (tab switching)
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    // Mouse activity
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mousedown', this.onMouseMove);

    // Keyboard activity
    document.addEventListener('keydown', this.onKeyPress);
    document.addEventListener('keyup', this.onKeyPress);

    // Window resize (potential multitasking)
    window.addEventListener('resize', this.onWindowResize);

    // Copy/paste detection
    document.addEventListener('copy', this.onCopy);
    document.addEventListener('paste', this.onPaste);

    // Context menu (right-click)
    document.addEventListener('contextmenu', this.onContextMenu);

    // Developer tools detection (basic)
    this.startDevToolsDetection();
  }

  private detachEventListeners(): void {
    window.removeEventListener('blur', this.onPageBlur);
    window.removeEventListener('focus', this.onPageFocus);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mousedown', this.onMouseMove);
    document.removeEventListener('keydown', this.onKeyPress);
    document.removeEventListener('keyup', this.onKeyPress);
    window.removeEventListener('resize', this.onWindowResize);
    document.removeEventListener('copy', this.onCopy);
    document.removeEventListener('paste', this.onPaste);
    document.removeEventListener('contextmenu', this.onContextMenu);
    this.stopDevToolsDetection();
  }

  // ============================================================================
  // Private Methods - Event Handlers
  // ============================================================================

  private onPageBlur = (): void => {
    this.pageBlurStartTime = Date.now();
  };

  private onPageFocus = (): void => {
    if (this.pageBlurStartTime !== null) {
      const duration = Math.floor((Date.now() - this.pageBlurStartTime) / 1000);
      this.pageBlurStartTime = null;

      if (duration > 1) { // Ignore very short blurs
        this.recordEvent('page_blur', duration, {
          userAgent: navigator.userAgent,
        });
      }
    }
  };

  private onVisibilityChange = (): void => {
    if (document.hidden) {
      this.pageBlurStartTime = Date.now();
    } else if (this.pageBlurStartTime !== null) {
      const duration = Math.floor((Date.now() - this.pageBlurStartTime) / 1000);
      this.pageBlurStartTime = null;

      if (duration > 1) {
        this.recordEvent('tab_switch', duration, {
          previousVisibilityState: document.visibilityState,
        });
      }
    }
  };

  private onMouseMove = (): void => {
    this.lastMouseMoveTime = Date.now();
    this.lastActivityTime = Date.now();
  };

  private onKeyPress = (): void => {
    this.lastKeyPressTime = Date.now();
    this.lastActivityTime = Date.now();
  };

  private onWindowResize = (): void => {
    this.recordEvent('window_resize', 0, {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight,
    });
  };

  private onCopy = (): void => {
    this.recordEvent('copy_paste', 0, {
      action: 'copy',
      timestamp: Date.now(),
    });
  };

  private onPaste = (): void => {
    this.recordEvent('copy_paste', 0, {
      action: 'paste',
      timestamp: Date.now(),
    });
  };

  private onContextMenu = (): void => {
    this.recordEvent('context_menu', 0, {
      timestamp: Date.now(),
    });
  };

  // ============================================================================
  // Private Methods - Inactivity Monitoring
  // ============================================================================

  private startInactivityMonitoring(): void {
    // Check for mouse idle
    const mouseIdleTimer = setInterval(() => {
      const idleTime = Date.now() - this.lastMouseMoveTime;
      if (idleTime >= this.config.mouseIdleThreshold) {
        this.recordEvent('mouse_idle', Math.floor(idleTime / 1000), {
          idleTimeMs: idleTime,
        });
        this.lastMouseMoveTime = Date.now(); // Reset to avoid duplicate events
      }
    }, 10000); // Check every 10 seconds

    this.timers.set('mouseIdle', mouseIdleTimer);

    // Check for keyboard idle
    const keyboardIdleTimer = setInterval(() => {
      const idleTime = Date.now() - this.lastKeyPressTime;
      if (idleTime >= this.config.keyboardIdleThreshold) {
        this.recordEvent('keyboard_idle', Math.floor(idleTime / 1000), {
          idleTimeMs: idleTime,
        });
        this.lastKeyPressTime = Date.now(); // Reset
      }
    }, 10000);

    this.timers.set('keyboardIdle', keyboardIdleTimer);

    // Check for combined inactivity
    const inactivityTimer = setInterval(() => {
      const idleTime = Date.now() - this.lastActivityTime;
      if (idleTime >= this.config.inactivityThreshold) {
        this.recordEvent('inactivity', Math.floor(idleTime / 1000), {
          idleTimeMs: idleTime,
        });
        this.lastActivityTime = Date.now(); // Reset
      }
    }, 15000); // Check every 15 seconds

    this.timers.set('inactivity', inactivityTimer);
  }

  private stopInactivityMonitoring(): void {
    this.timers.forEach((timer) => clearInterval(timer));
    this.timers.clear();
  }

  // ============================================================================
  // Private Methods - DevTools Detection
  // ============================================================================

  private startDevToolsDetection(): void {
    // Basic devtools detection using console methods
    // Note: This is not foolproof and can be bypassed
    const element = new Image();
    let devtoolsOpen = false;

    Object.defineProperty(element, 'id', {
      get: () => {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          this.recordEvent('devtools_open', 0, {
            detected: true,
            timestamp: Date.now(),
          });
        }
      },
    });

    const checkTimer = setInterval(() => {
      console.dir(element);
      devtoolsOpen = false;
    }, 1000);

    this.timers.set('devtools', checkTimer);
  }

  private stopDevToolsDetection(): void {
    const timer = this.timers.get('devtools');
    if (timer) {
      clearInterval(timer);
      this.timers.delete('devtools');
    }
  }

  // ============================================================================
  // Private Methods - Event Creation & Handling
  // ============================================================================

  private createEvent(
    eventType: DistractionEventType,
    durationSeconds: number,
    metadata: Record<string, any> = {}
  ): DistractionEvent {
    return {
      studentId: this.config.studentId,
      moduleId: this.config.moduleId,
      sessionId: this.config.sessionId,
      problemId: this.config.problemId,
      eventType,
      severityLevel: this.determineSeverity(durationSeconds),
      durationSeconds,
      metadata: {
        ...metadata,
        browser: this.getBrowserInfo(),
        screen: this.getScreenInfo(),
      },
      problemContext: this.config.problemContext,
      eventTimestamp: new Date(),
    };
  }

  private handleEvent(event: DistractionEvent): void {
    this.log('Event detected:', event);
    this.config.onEventDetected(event);

    if (this.config.enableBatching) {
      this.eventQueue.push(event);
      if (this.eventQueue.length >= this.config.batchSize) {
        this.flushEventQueue();
      }
    } else {
      this.sendEvent(event);
    }
  }

  private determineSeverity(durationSeconds: number): SeverityLevel {
    if (durationSeconds < 10) return 'minor';
    if (durationSeconds < 30) return 'moderate';
    if (durationSeconds < 60) return 'major';
    return 'critical';
  }

  // ============================================================================
  // Private Methods - API Communication
  // ============================================================================

  private startBatchProcessing(): void {
    this.batchTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flushEventQueue();
      }
    }, this.config.batchInterval);
  }

  private async flushEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await this.sendEvents(eventsToSend);
    } catch (error) {
      this.config.onError(error as Error);
      // Re-queue events on failure
      this.eventQueue.push(...eventsToSend);
    }
  }

  private async sendEvent(event: DistractionEvent): Promise<void> {
    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      this.config.onEventSent(event);
      this.log('Event sent:', event);
    } catch (error) {
      this.config.onError(error as Error);
      throw error;
    }
  }

  private async sendEvents(events: DistractionEvent[]): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        throw new Error(`Batch API request failed: ${response.status} ${response.statusText}`);
      }

      events.forEach((event) => this.config.onEventSent(event));
      this.log(`Batch sent: ${events.length} events`);
    } catch (error) {
      this.config.onError(error as Error);
      throw error;
    }
  }

  // ============================================================================
  // Private Methods - Utilities
  // ============================================================================

  private getBrowserInfo(): Record<string, any> {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
    };
  }

  private getScreenInfo(): Record<string, any> {
    return {
      width: screen.width,
      height: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth,
    };
  }

  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[DistractionTracker]', ...args);
    }
  }
}

// ============================================================================
// React Hook (Optional)
// ============================================================================

/**
 * React hook for using DistractionTracker
 *
 * Usage:
 * ```typescript
 * const { tracker, isTracking } = useDistractionTracker({
 *   studentId: 'uuid',
 *   moduleId: 'uuid',
 *   sessionId: 'uuid',
 *   apiEndpoint: '/api/distraction-events',
 *   autoStart: true,
 * });
 * ```
 */
export function useDistractionTracker(
  config: DistractionTrackerConfig & { autoStart?: boolean }
) {
  const [tracker] = React.useState(() => new DistractionTracker(config));
  const [isTracking, setIsTracking] = React.useState(false);

  React.useEffect(() => {
    if (config.autoStart) {
      tracker.start();
      setIsTracking(true);
    }

    return () => {
      tracker.stop();
      setIsTracking(false);
    };
  }, [tracker, config.autoStart]);

  const start = React.useCallback(() => {
    tracker.start();
    setIsTracking(true);
  }, [tracker]);

  const stop = React.useCallback(() => {
    tracker.stop();
    setIsTracking(false);
  }, [tracker]);

  const updateProblemContext = React.useCallback(
    (problemId: string, context: Record<string, any>) => {
      tracker.updateProblemContext(problemId, context);
    },
    [tracker]
  );

  return {
    tracker,
    isTracking,
    start,
    stop,
    updateProblemContext,
  };
}

// Note: Import React if using the hook
import * as React from 'react';
