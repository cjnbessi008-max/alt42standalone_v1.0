/**
 * Variance Vibration Handler
 * Maps statistical variance to vibration intensity for educational feedback
 * Integrates with existing VibrationHandler for device vibration control
 */

import {
  calculateVariance,
  calculateVarianceStats,
  normalizeVariance,
  validateDataSet,
  VarianceResult,
} from './VarianceCalculator';

export interface VarianceVibrationConfig {
  minIntensity: number; // Minimum vibration intensity (1-10)
  maxIntensity: number; // Maximum vibration intensity (1-10)
  varianceThreshold: number; // Variance value considered "high"
  useNormalizedVariance: boolean; // Use normalized variance (0-1) or raw
  vibrationEnabled: boolean; // Master enable/disable
  patternType: 'continuous' | 'pulsed' | 'progressive'; // Vibration pattern style
  debounceMs: number; // Minimum time between vibrations
}

export interface VarianceVibrationResult {
  variance: number;
  normalizedVariance: number;
  intensity: number; // 1-10 scale
  vibrationPattern: number[]; // Array of pulse durations in ms
  shouldVibrate: boolean;
  stats: VarianceResult;
}

// Default configuration
const DEFAULT_CONFIG: VarianceVibrationConfig = {
  minIntensity: 1,
  maxIntensity: 10,
  varianceThreshold: 100, // Default threshold for raw variance
  useNormalizedVariance: true, // Prefer normalized for consistency
  vibrationEnabled: true,
  patternType: 'progressive',
  debounceMs: 300,
};

/**
 * VarianceVibrationHandler class
 * Manages variance-based vibration feedback
 */
export class VarianceVibrationHandler {
  private config: VarianceVibrationConfig;
  private lastVibrationTime: number = 0;
  private lastVariance: number = 0;

  constructor(config: Partial<VarianceVibrationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<VarianceVibrationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): VarianceVibrationConfig {
    return { ...this.config };
  }

  /**
   * Map variance to vibration intensity (1-10 scale)
   */
  varianceToIntensity(variance: number, mean: number = 0): number {
    const { minIntensity, maxIntensity, varianceThreshold, useNormalizedVariance } = this.config;

    let normalizedValue: number;

    if (useNormalizedVariance && mean !== 0) {
      // Use normalized variance (coefficient of variation approach)
      normalizedValue = normalizeVariance(variance, mean);
    } else {
      // Use raw variance with threshold
      normalizedValue = Math.min(variance / varianceThreshold, 1.0);
    }

    // Map 0-1 normalized value to minIntensity-maxIntensity range
    const intensityRange = maxIntensity - minIntensity;
    const intensity = minIntensity + normalizedValue * intensityRange;

    // Round and clamp to valid range
    return Math.max(minIntensity, Math.min(maxIntensity, Math.round(intensity)));
  }

  /**
   * Generate vibration pattern based on intensity and pattern type
   */
  generateVibrationPattern(intensity: number): number[] {
    const { patternType } = this.config;

    // Base duration increases with intensity
    const baseDuration = 50 + intensity * 15; // 50ms to 200ms

    switch (patternType) {
      case 'continuous':
        // Single long vibration
        return [baseDuration * 2];

      case 'pulsed':
        // Repeating pulses, more pulses for higher intensity
        const pulseCount = Math.ceil(intensity / 3); // 1-4 pulses
        const pattern: number[] = [];
        for (let i = 0; i < pulseCount; i++) {
          pattern.push(baseDuration);
          if (i < pulseCount - 1) {
            pattern.push(50); // Gap between pulses
          }
        }
        return pattern;

      case 'progressive':
        // Increasing intensity pattern
        const progressivePattern: number[] = [];
        const steps = Math.min(intensity, 5);
        for (let i = 1; i <= steps; i++) {
          progressivePattern.push(Math.floor(baseDuration * (i / steps)));
          if (i < steps) {
            progressivePattern.push(30); // Short gap
          }
        }
        return progressivePattern;

      default:
        return [baseDuration];
    }
  }

  /**
   * Calculate variance and determine vibration parameters
   */
  calculateVibration(values: number[], isSample: boolean = false): VarianceVibrationResult {
    // Validate input
    const validation = validateDataSet(values);
    if (!validation.valid) {
      return {
        variance: 0,
        normalizedVariance: 0,
        intensity: this.config.minIntensity,
        vibrationPattern: [],
        shouldVibrate: false,
        stats: {
          mean: 0,
          variance: 0,
          standardDeviation: 0,
          count: 0,
          min: 0,
          max: 0,
          range: 0,
        },
      };
    }

    // Calculate statistics
    const stats = calculateVarianceStats(values, isSample);
    const { variance, mean } = stats;

    // Calculate normalized variance
    const normalizedVariance = normalizeVariance(variance, mean);

    // Map to intensity
    const intensity = this.varianceToIntensity(variance, mean);

    // Generate vibration pattern
    const vibrationPattern = this.generateVibrationPattern(intensity);

    // Determine if should vibrate (check debounce and enable)
    const now = Date.now();
    const timeSinceLastVibration = now - this.lastVibrationTime;
    const shouldVibrate =
      this.config.vibrationEnabled &&
      timeSinceLastVibration >= this.config.debounceMs &&
      variance > 0;

    if (shouldVibrate) {
      this.lastVibrationTime = now;
      this.lastVariance = variance;
    }

    return {
      variance,
      normalizedVariance,
      intensity,
      vibrationPattern,
      shouldVibrate,
      stats,
    };
  }

  /**
   * Check if vibration is supported on this device
   */
  static isVibrationSupported(): boolean {
    return (
      'vibrate' in navigator ||
      'mozVibrate' in navigator ||
      'webkitVibrate' in navigator
    );
  }

  /**
   * Trigger vibration with the generated pattern
   */
  triggerVibration(pattern: number[]): boolean {
    if (!VarianceVibrationHandler.isVibrationSupported()) {
      console.warn('Vibration API not supported on this device');
      return false;
    }

    try {
      // Try standard API
      if ('vibrate' in navigator) {
        return navigator.vibrate(pattern);
      }
      // Try webkit
      if ('webkitVibrate' in navigator) {
        return (navigator as any).webkitVibrate(pattern);
      }
      // Try moz
      if ('mozVibrate' in navigator) {
        return (navigator as any).mozVibrate(pattern);
      }
      return false;
    } catch (error) {
      console.error('Error triggering vibration:', error);
      return false;
    }
  }

  /**
   * Process data and trigger vibration if needed
   */
  processAndVibrate(values: number[], isSample: boolean = false): VarianceVibrationResult {
    const result = this.calculateVibration(values, isSample);

    if (result.shouldVibrate && result.vibrationPattern.length > 0) {
      this.triggerVibration(result.vibrationPattern);
    }

    return result;
  }

  /**
   * Get intensity level description
   */
  static getIntensityDescription(intensity: number): string {
    if (intensity <= 2) return '매우 낮음 (Very Low)';
    if (intensity <= 4) return '낮음 (Low)';
    if (intensity <= 6) return '보통 (Medium)';
    if (intensity <= 8) return '높음 (High)';
    return '매우 높음 (Very High)';
  }

  /**
   * Get variance level description
   */
  static getVarianceDescription(normalizedVariance: number): string {
    if (normalizedVariance < 0.2) return '데이터가 매우 일정합니다 (Very consistent data)';
    if (normalizedVariance < 0.4) return '데이터가 일정합니다 (Consistent data)';
    if (normalizedVariance < 0.6) return '데이터가 약간 퍼져있습니다 (Moderately spread data)';
    if (normalizedVariance < 0.8) return '데이터가 많이 퍼져있습니다 (Highly spread data)';
    return '데이터가 매우 많이 퍼져있습니다 (Extremely spread data)';
  }

  /**
   * Reset debounce timer (useful for testing)
   */
  resetDebounce(): void {
    this.lastVibrationTime = 0;
  }
}

/**
 * Create a singleton instance with default config
 */
let defaultHandler: VarianceVibrationHandler | null = null;

export function getDefaultHandler(): VarianceVibrationHandler {
  if (!defaultHandler) {
    defaultHandler = new VarianceVibrationHandler();
  }
  return defaultHandler;
}

/**
 * Quick helper function for one-off vibration
 */
export function vibrateForVariance(
  values: number[],
  config?: Partial<VarianceVibrationConfig>
): VarianceVibrationResult {
  const handler = config ? new VarianceVibrationHandler(config) : getDefaultHandler();
  return handler.processAndVibrate(values);
}

export default VarianceVibrationHandler;
