/**
 * Focus Mode Controller
 * Manages focus state transitions based on blink metrics
 */

import type {
  BlinkMetrics,
  FocusState,
  FocusMetrics,
  FocusModeConfig,
  FocusModeCallbacks,
} from '../types/focus-mode.types';

interface BlinkDataPoint {
  timestamp: number;
  blinkCount: number;
}

export class FocusModeController {
  private config: FocusModeConfig;
  private callbacks: FocusModeCallbacks;
  private focusState: FocusState = 'unknown';
  private focusStartTime: number | null = null;
  private blinkRateHistory: BlinkDataPoint[] = [];
  private currentBlinkCount = 0;

  constructor(config: FocusModeConfig, callbacks: FocusModeCallbacks = {}) {
    this.config = config;
    this.callbacks = callbacks;
  }

  /**
   * Update blink rate and determine focus state
   */
  public updateBlinkRate(metrics: BlinkMetrics): FocusMetrics {
    const now = Date.now();

    // Add current data point
    this.blinkRateHistory.push({
      timestamp: now,
      blinkCount: metrics.totalBlinks - this.currentBlinkCount,
    });
    this.currentBlinkCount = metrics.totalBlinks;

    // Clean up old data (keep only windowSize seconds)
    const windowMs = this.config.windowSize * 1000;
    this.blinkRateHistory = this.blinkRateHistory.filter(
      item => now - item.timestamp < windowMs
    );

    // Calculate blinks per minute over the window
    const blinksPerMinute = this.calculateBlinksPerMinute();

    // Determine new focus state
    const previousState = this.focusState;
    const newState = this.determineFocusState(blinksPerMinute);

    // Handle state transitions
    if (previousState !== newState) {
      this.handleStateTransition(previousState, newState, blinksPerMinute);
    }

    // Calculate focus duration
    const focusDuration = this.focusStartTime
      ? (now - this.focusStartTime) / 1000
      : 0;

    // Calculate confidence score based on data window completeness
    const confidenceScore = this.calculateConfidenceScore();

    const focusMetrics: FocusMetrics = {
      state: this.focusState,
      blinksPerMinute,
      focusDuration,
      confidenceScore,
    };

    // Callback for metrics update
    if (this.callbacks.onMetricsUpdate) {
      this.callbacks.onMetricsUpdate(metrics);
    }

    return focusMetrics;
  }

  /**
   * Calculate blinks per minute from history
   */
  private calculateBlinksPerMinute(): number {
    if (this.blinkRateHistory.length === 0) {
      return 0;
    }

    const now = Date.now();
    const totalBlinks = this.blinkRateHistory.reduce(
      (sum, item) => sum + item.blinkCount,
      0
    );

    const oldestTimestamp = this.blinkRateHistory[0].timestamp;
    const timeWindowSeconds = (now - oldestTimestamp) / 1000;

    if (timeWindowSeconds === 0) {
      return 0;
    }

    return (totalBlinks / timeWindowSeconds) * 60;
  }

  /**
   * Determine focus state based on blink rate
   */
  private determineFocusState(blinksPerMinute: number): FocusState {
    // Hysteresis: use different thresholds for entering vs. exiting focused state
    if (this.focusState === 'focused') {
      // Require higher blink rate to exit focused state (prevent flickering)
      if (blinksPerMinute >= this.config.unfocusThreshold) {
        return 'normal';
      }
      if (blinksPerMinute >= 25) {
        return 'distracted';
      }
      return 'focused';
    } else {
      // Lower threshold to enter focused state
      if (blinksPerMinute <= this.config.focusThreshold) {
        return 'focused';
      }
      if (blinksPerMinute >= 25) {
        return 'distracted';
      }
      return 'normal';
    }
  }

  /**
   * Handle state transitions
   */
  private handleStateTransition(
    previousState: FocusState,
    newState: FocusState,
    blinksPerMinute: number
  ): void {
    this.focusState = newState;

    console.log(`Focus state transition: ${previousState} -> ${newState} (${blinksPerMinute.toFixed(1)} blinks/min)`);

    // Handle entering focused state
    if (newState === 'focused' && previousState !== 'focused') {
      this.focusStartTime = Date.now();

      const metrics: FocusMetrics = {
        state: newState,
        blinksPerMinute,
        focusDuration: 0,
        confidenceScore: this.calculateConfidenceScore(),
      };

      if (this.callbacks.onFocusStart) {
        this.callbacks.onFocusStart(metrics);
      }
    }

    // Handle exiting focused state
    if (previousState === 'focused' && newState !== 'focused') {
      const focusDuration = this.focusStartTime
        ? (Date.now() - this.focusStartTime) / 1000
        : 0;

      const metrics: FocusMetrics = {
        state: newState,
        blinksPerMinute,
        focusDuration,
        confidenceScore: this.calculateConfidenceScore(),
      };

      if (this.callbacks.onFocusEnd) {
        this.callbacks.onFocusEnd(metrics);
      }

      this.focusStartTime = null;
    }
  }

  /**
   * Calculate confidence score (0-1) based on data completeness
   */
  private calculateConfidenceScore(): number {
    if (this.blinkRateHistory.length === 0) {
      return 0;
    }

    const now = Date.now();
    const oldestTimestamp = this.blinkRateHistory[0].timestamp;
    const actualWindowSeconds = (now - oldestTimestamp) / 1000;
    const targetWindowSeconds = this.config.windowSize;

    // Confidence increases as we approach full window
    const completeness = Math.min(actualWindowSeconds / targetWindowSeconds, 1);

    // Also factor in number of data points
    const minDataPoints = 5;
    const dataPointsFactor = Math.min(this.blinkRateHistory.length / minDataPoints, 1);

    return (completeness + dataPointsFactor) / 2;
  }

  /**
   * Get current focus state
   */
  public getFocusState(): FocusState {
    return this.focusState;
  }

  /**
   * Get current focus duration in seconds
   */
  public getFocusDuration(): number {
    if (!this.focusStartTime) {
      return 0;
    }
    return (Date.now() - this.focusStartTime) / 1000;
  }

  /**
   * Check if currently in focus mode
   */
  public isFocused(): boolean {
    return this.focusState === 'focused';
  }

  /**
   * Reset focus mode controller
   */
  public reset(): void {
    const wasInFocusMode = this.focusState === 'focused';

    this.focusState = 'unknown';
    this.focusStartTime = null;
    this.blinkRateHistory = [];
    this.currentBlinkCount = 0;

    if (wasInFocusMode && this.callbacks.onFocusEnd) {
      this.callbacks.onFocusEnd({
        state: 'unknown',
        blinksPerMinute: 0,
        focusDuration: 0,
        confidenceScore: 0,
      });
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<FocusModeConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Update callbacks
   */
  public updateCallbacks(callbacks: Partial<FocusModeCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Get statistics for debugging/analytics
   */
  public getStatistics() {
    return {
      focusState: this.focusState,
      focusDuration: this.getFocusDuration(),
      dataPoints: this.blinkRateHistory.length,
      confidenceScore: this.calculateConfidenceScore(),
      blinksPerMinute: this.calculateBlinksPerMinute(),
    };
  }
}
