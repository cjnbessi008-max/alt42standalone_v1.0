/**
 * Blink Detection Service
 * Uses Eye Aspect Ratio (EAR) algorithm to detect eye blinks
 */

import type {
  Point,
  EyeLandmarks,
  BlinkEvent,
  BlinkMetrics,
  FocusModeConfig,
} from '../types/focus-mode.types';

export class BlinkDetector {
  private config: FocusModeConfig;
  private blinkHistory: BlinkEvent[] = [];
  private leftEyeClosedFrames = 0;
  private rightEyeClosedFrames = 0;
  private lastLeftBlinkStart: number | null = null;
  private lastRightBlinkStart: number | null = null;

  constructor(config: FocusModeConfig) {
    this.config = config;
  }

  /**
   * Calculate Eye Aspect Ratio (EAR)
   * EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
   *
   * Eye landmarks indices (6 points):
   *     p1 ----------- p4
   *    /  \         /  \
   *  p2    p3    p5    p6
   *
   * When eye is open: EAR ≈ 0.3
   * When eye is closed: EAR ≈ 0.1-0.2
   */
  private calculateEAR(eyeLandmarks: Point[]): number {
    if (eyeLandmarks.length < 6) {
      throw new Error('Eye landmarks must have at least 6 points');
    }

    // Vertical distances
    const vertical1 = this.euclideanDistance(eyeLandmarks[1], eyeLandmarks[5]);
    const vertical2 = this.euclideanDistance(eyeLandmarks[2], eyeLandmarks[4]);

    // Horizontal distance
    const horizontal = this.euclideanDistance(eyeLandmarks[0], eyeLandmarks[3]);

    return (vertical1 + vertical2) / (2.0 * horizontal);
  }

  /**
   * Calculate Euclidean distance between two points
   */
  private euclideanDistance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p1.z && p2.z ? p2.z - p1.z : 0;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Process eye landmarks and detect blinks
   */
  public processFrame(eyeLandmarks: EyeLandmarks): BlinkEvent | null {
    const now = Date.now();

    // Calculate EAR for both eyes
    const leftEAR = this.calculateEAR(eyeLandmarks.left);
    const rightEAR = this.calculateEAR(eyeLandmarks.right);

    let blinkEvent: BlinkEvent | null = null;

    // Left eye blink detection
    if (leftEAR < this.config.earThreshold) {
      if (this.leftEyeClosedFrames === 0) {
        this.lastLeftBlinkStart = now;
      }
      this.leftEyeClosedFrames++;
    } else {
      if (this.leftEyeClosedFrames >= this.config.consecutiveFrames && this.lastLeftBlinkStart) {
        const duration = now - this.lastLeftBlinkStart;
        blinkEvent = {
          timestamp: now,
          eye: 'left',
          duration,
        };
        this.blinkHistory.push(blinkEvent);
      }
      this.leftEyeClosedFrames = 0;
      this.lastLeftBlinkStart = null;
    }

    // Right eye blink detection
    if (rightEAR < this.config.earThreshold) {
      if (this.rightEyeClosedFrames === 0) {
        this.lastRightBlinkStart = now;
      }
      this.rightEyeClosedFrames++;
    } else {
      if (this.rightEyeClosedFrames >= this.config.consecutiveFrames && this.lastRightBlinkStart) {
        const duration = now - this.lastRightBlinkStart;

        // If both eyes blinked at similar time, mark as "both"
        if (blinkEvent && Math.abs(blinkEvent.timestamp - now) < 100) {
          blinkEvent.eye = 'both';
          blinkEvent.duration = Math.max(blinkEvent.duration, duration);
        } else {
          blinkEvent = {
            timestamp: now,
            eye: 'right',
            duration,
          };
          this.blinkHistory.push(blinkEvent);
        }
      }
      this.rightEyeClosedFrames = 0;
      this.lastRightBlinkStart = null;
    }

    // Clean up old blinks (keep last 2 minutes)
    const twoMinutesAgo = now - 120 * 1000;
    this.blinkHistory = this.blinkHistory.filter(b => b.timestamp > twoMinutesAgo);

    return blinkEvent;
  }

  /**
   * Get current blink metrics
   */
  public getMetrics(windowSize: number = 60): BlinkMetrics {
    const now = Date.now();
    const windowMs = windowSize * 1000;
    const windowStart = now - windowMs;

    // Filter blinks within window
    const recentBlinks = this.blinkHistory.filter(b => b.timestamp >= windowStart);

    const totalBlinks = recentBlinks.length;

    // Calculate blinks per minute
    const actualWindowSeconds = recentBlinks.length > 0
      ? (now - recentBlinks[0].timestamp) / 1000
      : windowSize;
    const blinksPerMinute = actualWindowSeconds > 0
      ? (totalBlinks / actualWindowSeconds) * 60
      : 0;

    // Calculate average blink duration
    const averageBlinkDuration = recentBlinks.length > 0
      ? recentBlinks.reduce((sum, b) => sum + b.duration, 0) / recentBlinks.length
      : 0;

    const lastBlinkTimestamp = recentBlinks.length > 0
      ? recentBlinks[recentBlinks.length - 1].timestamp
      : 0;

    return {
      totalBlinks,
      blinksPerMinute,
      averageBlinkDuration,
      lastBlinkTimestamp,
    };
  }

  /**
   * Reset all tracking data
   */
  public reset(): void {
    this.blinkHistory = [];
    this.leftEyeClosedFrames = 0;
    this.rightEyeClosedFrames = 0;
    this.lastLeftBlinkStart = null;
    this.lastRightBlinkStart = null;
  }

  /**
   * Get all blink events in history
   */
  public getBlinkHistory(): BlinkEvent[] {
    return [...this.blinkHistory];
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<FocusModeConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
