/**
 * VibrationHandler - Utility class for managing haptic feedback in LMS
 *
 * Provides vibration alerts for high-risk wrong answer scenarios
 * Supports Web Vibration API with fallback detection
 */

export interface VibrationConfig {
  trigger: boolean;
  pattern: VibrationPatternName;
  duration_ms: number;
  intensity: number; // 1-10 scale
  pulses?: number[];
}

export type VibrationPatternName =
  | 'short_pulse'
  | 'double_pulse'
  | 'warning_pattern'
  | 'critical_alert'
  | 'success_pulse'
  | 'encouragement';

export type RiskLevel = 'low' | 'medium' | 'high';

/**
 * Predefined vibration patterns for educational contexts
 */
export const VIBRATION_PATTERNS: Record<VibrationPatternName, number[]> = {
  short_pulse: [200],
  double_pulse: [100, 50, 100],
  warning_pattern: [150, 75, 150, 75, 150],
  critical_alert: [200, 100, 200, 100, 200, 100, 200],
  success_pulse: [200],
  encouragement: [50, 50, 50, 50, 50],
};

/**
 * Intensity multipliers for vibration strength
 */
const INTENSITY_MULTIPLIER: Record<number, number> = {
  1: 0.3,
  2: 0.4,
  3: 0.5,
  4: 0.6,
  5: 0.7,
  6: 0.8,
  7: 0.9,
  8: 1.0,
  9: 1.1,
  10: 1.2,
};

/**
 * Pattern mapping based on risk level and correctness
 */
export const RISK_LEVEL_PATTERNS: Record<RiskLevel, VibrationPatternName> = {
  low: 'short_pulse',
  medium: 'double_pulse',
  high: 'warning_pattern',
};

export class VibrationHandler {
  private static deviceSupported: boolean | null = null;
  private static userPreference: boolean = true;

  /**
   * Check if device supports vibration API
   * @returns boolean indicating vibration support
   */
  static isSupported(): boolean {
    if (this.deviceSupported !== null) {
      return this.deviceSupported;
    }

    const nav = navigator as any;
    this.deviceSupported = !!(nav.vibrate || nav.webkitVibrate || nav.mozVibrate);

    return this.deviceSupported;
  }

  /**
   * Set user preference for vibration (e.g., from settings)
   * @param enabled - whether user wants vibration enabled
   */
  static setUserPreference(enabled: boolean): void {
    this.userPreference = enabled;
    localStorage.setItem('vibration_preference', JSON.stringify(enabled));
  }

  /**
   * Get user preference from localStorage
   * @returns boolean indicating user preference
   */
  static getUserPreference(): boolean {
    const stored = localStorage.getItem('vibration_preference');
    if (stored !== null) {
      this.userPreference = JSON.parse(stored);
    }
    return this.userPreference;
  }

  /**
   * Trigger vibration with a specific pattern
   * @param pattern - array of milliseconds for vibration pulses
   * @returns boolean indicating if vibration was triggered
   */
  static vibrate(pattern: number | number[]): boolean {
    if (!this.isSupported() || !this.getUserPreference()) {
      return false;
    }

    const nav = navigator as any;
    try {
      if (nav.vibrate) {
        return nav.vibrate(pattern);
      } else if (nav.webkitVibrate) {
        return nav.webkitVibrate(pattern);
      } else if (nav.mozVibrate) {
        return nav.mozVibrate(pattern);
      }
    } catch (error) {
      console.error('Vibration API error:', error);
      return false;
    }

    return false;
  }

  /**
   * Stop any ongoing vibration
   */
  static cancel(): void {
    if (this.isSupported()) {
      this.vibrate(0);
    }
  }

  /**
   * Trigger vibration using a named pattern
   * @param patternName - name of the predefined pattern
   * @param intensity - intensity level (1-10), optional
   * @returns boolean indicating if vibration was triggered
   */
  static vibrateWithPattern(
    patternName: VibrationPatternName,
    intensity: number = 5
  ): boolean {
    const pattern = VIBRATION_PATTERNS[patternName];
    if (!pattern) {
      console.warn(`Unknown vibration pattern: ${patternName}`);
      return false;
    }

    const adjustedPattern = this.applyIntensity(pattern, intensity);
    return this.vibrate(adjustedPattern);
  }

  /**
   * Apply intensity multiplier to pattern
   * @param pattern - original vibration pattern
   * @param intensity - intensity level (1-10)
   * @returns adjusted pattern
   */
  private static applyIntensity(pattern: number[], intensity: number): number[] {
    const clampedIntensity = Math.max(1, Math.min(10, intensity));
    const multiplier = INTENSITY_MULTIPLIER[clampedIntensity] || 1.0;

    return pattern.map(duration => Math.round(duration * multiplier));
  }

  /**
   * Trigger vibration based on risk level and answer correctness
   * @param isCorrect - whether the answer was correct
   * @param riskLevel - assessed risk level
   * @param customPattern - optional custom pattern override
   * @param intensity - optional intensity override
   * @returns boolean indicating if vibration was triggered
   */
  static vibrateForAnswer(
    isCorrect: boolean,
    riskLevel: RiskLevel = 'medium',
    customPattern?: VibrationPatternName,
    intensity: number = 5
  ): boolean {
    if (isCorrect) {
      // Optional positive feedback for correct answers
      return this.vibrateWithPattern('success_pulse', 4);
    }

    // Wrong answer - use risk-based pattern
    const pattern = customPattern || RISK_LEVEL_PATTERNS[riskLevel];
    return this.vibrateWithPattern(pattern, intensity);
  }

  /**
   * Trigger vibration from API response config
   * @param config - vibration configuration from API
   * @returns boolean indicating if vibration was triggered
   */
  static vibrateFromConfig(config: VibrationConfig): boolean {
    if (!config.trigger) {
      return false;
    }

    // Use custom pulses if provided, otherwise use named pattern
    if (config.pulses && config.pulses.length > 0) {
      const adjustedPulses = this.applyIntensity(config.pulses, config.intensity);
      return this.vibrate(adjustedPulses);
    }

    return this.vibrateWithPattern(config.pattern, config.intensity);
  }

  /**
   * Test vibration support with a gentle pulse
   * @returns boolean indicating if test was successful
   */
  static testVibration(): boolean {
    return this.vibrate([100, 50, 100]);
  }

  /**
   * Get device and preference status
   * @returns object with support and preference status
   */
  static getStatus(): {
    supported: boolean;
    enabled: boolean;
    userAgent: string;
  } {
    return {
      supported: this.isSupported(),
      enabled: this.getUserPreference(),
      userAgent: navigator.userAgent,
    };
  }

  /**
   * Log vibration event for analytics
   * @param event - vibration event details
   */
  static logEvent(event: {
    studentId: string;
    problemId: string;
    moduleId: string;
    isCorrect: boolean;
    pattern: VibrationPatternName;
    intensity: number;
    riskLevel: RiskLevel;
  }): void {
    const status = this.getStatus();
    const eventData = {
      ...event,
      deviceSupported: status.supported,
      userAgent: status.userAgent,
      timestamp: new Date().toISOString(),
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Vibration Event:', eventData);
    }

    // Send to analytics endpoint (to be implemented)
    // fetch('/api/vibration/events', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(eventData),
    // });
  }
}

/**
 * React Hook for vibration functionality
 */
export const useVibration = () => {
  const isSupported = VibrationHandler.isSupported();
  const isEnabled = VibrationHandler.getUserPreference();

  const vibrate = (pattern: number | number[]) => {
    return VibrationHandler.vibrate(pattern);
  };

  const vibrateWithPattern = (
    patternName: VibrationPatternName,
    intensity?: number
  ) => {
    return VibrationHandler.vibrateWithPattern(patternName, intensity);
  };

  const vibrateForAnswer = (
    isCorrect: boolean,
    riskLevel?: RiskLevel,
    customPattern?: VibrationPatternName,
    intensity?: number
  ) => {
    return VibrationHandler.vibrateForAnswer(
      isCorrect,
      riskLevel,
      customPattern,
      intensity
    );
  };

  const setEnabled = (enabled: boolean) => {
    VibrationHandler.setUserPreference(enabled);
  };

  const cancel = () => {
    VibrationHandler.cancel();
  };

  return {
    isSupported,
    isEnabled,
    vibrate,
    vibrateWithPattern,
    vibrateForAnswer,
    setEnabled,
    cancel,
  };
};

export default VibrationHandler;
