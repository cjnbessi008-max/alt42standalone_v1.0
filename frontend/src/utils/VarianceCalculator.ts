/**
 * Variance Calculator Utility
 * Calculates statistical variance and standard deviation for data sets
 * Used for Variance Vibration feature in Alt42 Education Platform
 */

export interface DataSet {
  values: number[];
  label?: string;
}

export interface VarianceResult {
  mean: number;
  variance: number;
  standardDeviation: number;
  count: number;
  min: number;
  max: number;
  range: number;
}

/**
 * Calculate the mean (average) of an array of numbers
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Calculate the variance of an array of numbers
 * @param values - Array of numeric values
 * @param isSample - If true, uses sample variance (n-1), otherwise population variance (n)
 */
export function calculateVariance(values: number[], isSample: boolean = false): number {
  if (values.length === 0) return 0;
  if (values.length === 1 && isSample) return 0;

  const mean = calculateMean(values);
  const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
  const sumSquaredDiff = squaredDifferences.reduce((acc, val) => acc + val, 0);

  const divisor = isSample ? values.length - 1 : values.length;
  return sumSquaredDiff / divisor;
}

/**
 * Calculate standard deviation
 */
export function calculateStandardDeviation(values: number[], isSample: boolean = false): number {
  return Math.sqrt(calculateVariance(values, isSample));
}

/**
 * Calculate comprehensive variance statistics
 */
export function calculateVarianceStats(values: number[], isSample: boolean = false): VarianceResult {
  if (values.length === 0) {
    return {
      mean: 0,
      variance: 0,
      standardDeviation: 0,
      count: 0,
      min: 0,
      max: 0,
      range: 0,
    };
  }

  const mean = calculateMean(values);
  const variance = calculateVariance(values, isSample);
  const standardDeviation = Math.sqrt(variance);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  return {
    mean,
    variance,
    standardDeviation,
    count: values.length,
    min,
    max,
    range,
  };
}

/**
 * Normalize variance to a 0-1 scale based on theoretical maximum
 * Uses coefficient of variation (CV) approach for relative variance
 */
export function normalizeVariance(variance: number, mean: number): number {
  if (mean === 0) return 0;

  // Calculate coefficient of variation (CV = σ/μ)
  const cv = Math.sqrt(variance) / Math.abs(mean);

  // Normalize CV to 0-1 range
  // Typical CV ranges: 0-0.5 (low), 0.5-1.0 (medium), 1.0+ (high)
  // We'll cap at 2.0 for normalization
  const normalizedCV = Math.min(cv / 2.0, 1.0);

  return normalizedCV;
}

/**
 * Calculate relative variance change between two datasets
 * Returns positive value if variance increased, negative if decreased
 */
export function calculateVarianceChange(
  oldValues: number[],
  newValues: number[],
  isSample: boolean = false
): number {
  const oldVariance = calculateVariance(oldValues, isSample);
  const newVariance = calculateVariance(newValues, isSample);

  if (oldVariance === 0) return newVariance > 0 ? 1 : 0;

  return (newVariance - oldVariance) / oldVariance;
}

/**
 * Validate if array contains valid numeric values
 */
export function validateDataSet(values: number[]): { valid: boolean; error?: string } {
  if (!Array.isArray(values)) {
    return { valid: false, error: 'Data must be an array' };
  }

  if (values.length === 0) {
    return { valid: false, error: 'Data array cannot be empty' };
  }

  const hasInvalidValues = values.some(val =>
    typeof val !== 'number' || !isFinite(val)
  );

  if (hasInvalidValues) {
    return { valid: false, error: 'All values must be finite numbers' };
  }

  return { valid: true };
}

/**
 * Generate sample data for testing with specified variance characteristics
 */
export function generateSampleData(
  count: number,
  mean: number,
  targetVariance: number
): number[] {
  const stdDev = Math.sqrt(targetVariance);
  const values: number[] = [];

  // Use Box-Muller transform for normal distribution
  for (let i = 0; i < count; i++) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    values.push(mean + z * stdDev);
  }

  return values;
}

export default {
  calculateMean,
  calculateVariance,
  calculateStandardDeviation,
  calculateVarianceStats,
  normalizeVariance,
  calculateVarianceChange,
  validateDataSet,
  generateSampleData,
};
