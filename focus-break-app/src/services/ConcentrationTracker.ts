/**
 * ConcentrationTracker Service
 * Tracks user concentration based on:
 * - Page visibility (tab switching)
 * - User activity (mouse/keyboard events)
 * - Idle time detection
 */

export type ConcentrationStatus = 'focused' | 'break' | 'idle';

export interface ConcentrationEvent {
  status: ConcentrationStatus;
  timestamp: number;
  reason: string;
}

export class ConcentrationTracker {
  private status: ConcentrationStatus = 'focused';
  private lastActivityTime: number = Date.now();
  private idleThreshold: number = 30000; // 30 seconds of inactivity
  private checkInterval: number = 1000; // Check every second
  private intervalId: number | null = null;
  private listeners: Set<(event: ConcentrationEvent) => void> = new Set();

  constructor(idleThreshold: number = 30000) {
    this.idleThreshold = idleThreshold;
  }

  /**
   * Start tracking concentration
   */
  public start(): void {
    this.setupEventListeners();
    this.startIdleCheck();
    this.updateStatus('focused', 'Tracking started');
  }

  /**
   * Stop tracking concentration
   */
  public stop(): void {
    this.removeEventListeners();
    this.stopIdleCheck();
  }

  /**
   * Subscribe to concentration changes
   */
  public subscribe(callback: (event: ConcentrationEvent) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Get current concentration status
   */
  public getStatus(): ConcentrationStatus {
    return this.status;
  }

  /**
   * Manual break trigger
   */
  public triggerBreak(): void {
    this.updateStatus('break', 'Manual break triggered');
  }

  /**
   * Resume focus
   */
  public resumeFocus(): void {
    this.lastActivityTime = Date.now();
    this.updateStatus('focused', 'Focus resumed');
  }

  private setupEventListeners(): void {
    // Track page visibility changes (tab switching)
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // Track user activity
    document.addEventListener('mousemove', this.handleActivity);
    document.addEventListener('mousedown', this.handleActivity);
    document.addEventListener('keydown', this.handleActivity);
    document.addEventListener('scroll', this.handleActivity);
    document.addEventListener('touchstart', this.handleActivity);
  }

  private removeEventListeners(): void {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    document.removeEventListener('mousemove', this.handleActivity);
    document.removeEventListener('mousedown', this.handleActivity);
    document.removeEventListener('keydown', this.handleActivity);
    document.removeEventListener('scroll', this.handleActivity);
    document.removeEventListener('touchstart', this.handleActivity);
  }

  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.updateStatus('break', 'Tab switched or window minimized');
    } else {
      this.lastActivityTime = Date.now();
      this.updateStatus('focused', 'Tab became visible');
    }
  };

  private handleActivity = (): void => {
    this.lastActivityTime = Date.now();

    // If was idle or on break, return to focus
    if (this.status !== 'focused') {
      this.updateStatus('focused', 'Activity detected');
    }
  };

  private startIdleCheck(): void {
    this.intervalId = window.setInterval(() => {
      const timeSinceActivity = Date.now() - this.lastActivityTime;

      if (timeSinceActivity >= this.idleThreshold && this.status === 'focused' && !document.hidden) {
        this.updateStatus('idle', `No activity for ${Math.round(timeSinceActivity / 1000)} seconds`);
      }
    }, this.checkInterval);
  }

  private stopIdleCheck(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private updateStatus(newStatus: ConcentrationStatus, reason: string): void {
    const oldStatus = this.status;

    if (oldStatus !== newStatus) {
      this.status = newStatus;

      const event: ConcentrationEvent = {
        status: newStatus,
        timestamp: Date.now(),
        reason
      };

      // Notify all listeners
      this.listeners.forEach(listener => listener(event));
    }
  }
}

export default ConcentrationTracker;
