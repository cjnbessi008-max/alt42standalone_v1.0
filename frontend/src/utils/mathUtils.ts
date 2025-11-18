/**
 * Utility functions for mathematical calculations and number formatting
 */

/**
 * Format a number for display on the real line
 * Handles very large, very small, and normal numbers
 */
export function formatNumber(value: number, precision: number = 2): string {
  if (!isFinite(value)) {
    return value > 0 ? '+∞' : '-∞';
  }

  const absValue = Math.abs(value);

  // Very large numbers - use scientific notation
  if (absValue > 1e6) {
    return value.toExponential(precision);
  }

  // Very small numbers - use scientific notation
  if (absValue < 1e-4 && absValue > 0) {
    return value.toExponential(precision);
  }

  // Normal numbers - use fixed precision
  return value.toFixed(precision);
}

/**
 * Calculate appropriate tick interval based on viewport range
 */
export function calculateTickInterval(range: number): number {
  const magnitude = Math.floor(Math.log10(range));
  const base = Math.pow(10, magnitude);

  const normalized = range / base;

  if (normalized <= 2) return base / 5;
  if (normalized <= 5) return base / 2;
  return base;
}

/**
 * Generate tick positions for a given range
 */
export function generateTicks(min: number, max: number, maxTicks: number = 10): number[] {
  const range = max - min;
  const interval = calculateTickInterval(range);

  const ticks: number[] = [];
  const start = Math.ceil(min / interval) * interval;

  for (let i = start; i <= max && ticks.length < maxTicks; i += interval) {
    ticks.push(i);
  }

  return ticks;
}

/**
 * Compress infinite real line to finite viewport using atan transformation
 * Maps (-∞, +∞) to (-π/2, π/2)
 */
export function compressToViewport(value: number): number {
  return Math.atan(value);
}

/**
 * Decompress from viewport back to real line
 * Maps (-π/2, π/2) to (-∞, +∞)
 */
export function decompressFromViewport(compressed: number): number {
  return Math.tan(compressed);
}

/**
 * Map a value from one range to another
 */
export function mapRange(
  value: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number
): number {
  return ((value - fromMin) * (toMax - toMin)) / (fromMax - fromMin) + toMin;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Check if a number is within a tolerance of another
 */
export function isWithinTolerance(value: number, target: number, tolerance: number): boolean {
  return Math.abs(value - target) <= tolerance;
}
