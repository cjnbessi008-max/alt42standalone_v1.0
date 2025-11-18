// Geometry calculation utilities

import { Point, Line, RatioCalculation } from '@/types/geometry';

/**
 * Calculate distance between two points
 */
export const calculateDistance = (p1: Point, p2: Point): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Calculate greatest common divisor using Euclidean algorithm
 */
export const gcd = (a: number, b: number): number => {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));

  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }

  return a;
};

/**
 * Simplify a ratio to its lowest terms
 */
export const simplifyRatio = (num1: number, num2: number): string => {
  if (num2 === 0) return 'undefined';

  // Round to 2 decimal places to avoid floating point issues
  const rounded1 = Math.round(num1 * 100);
  const rounded2 = Math.round(num2 * 100);

  const divisor = gcd(rounded1, rounded2);

  const simplified1 = rounded1 / divisor;
  const simplified2 = rounded2 / divisor;

  return `${simplified1}:${simplified2}`;
};

/**
 * Calculate ratio between two lengths
 */
export const calculateRatio = (
  line1: Line,
  line2: Line
): RatioCalculation => {
  const length1 = calculateDistance(line1.start, line1.end);
  const length2 = calculateDistance(line2.start, line2.end);

  const ratio = length2 !== 0 ? length1 / length2 : 0;
  const percentage = length2 !== 0 ? (length1 / length2) * 100 : 0;

  return {
    line1Id: line1.id,
    line2Id: line2.id,
    line1Length: Math.round(length1 * 100) / 100,
    line2Length: Math.round(length2 * 100) / 100,
    ratio: Math.round(ratio * 100) / 100,
    simplifiedRatio: simplifyRatio(length1, length2),
    percentage: Math.round(percentage * 100) / 100,
  };
};

/**
 * Check if two ratios are approximately equal (within tolerance)
 */
export const areRatiosEqual = (
  ratio1: number,
  ratio2: number,
  tolerance: number = 0.05
): boolean => {
  return Math.abs(ratio1 - ratio2) <= tolerance;
};

/**
 * Calculate angle between two points (in degrees)
 */
export const calculateAngle = (p1: Point, p2: Point): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const radians = Math.atan2(dy, dx);
  return (radians * 180) / Math.PI;
};

/**
 * Snap point to grid
 */
export const snapToGrid = (point: Point, gridSize: number): Point => {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
};

/**
 * Check if point is within bounds
 */
export const isPointInBounds = (
  point: Point,
  width: number,
  height: number
): boolean => {
  return point.x >= 0 && point.x <= width && point.y >= 0 && point.y <= height;
};

/**
 * Format length for display
 */
export const formatLength = (length: number, unit: string = 'px'): string => {
  return `${Math.round(length * 100) / 100} ${unit}`;
};

/**
 * Convert pixels to arbitrary units (for educational purposes)
 */
export const pixelsToUnits = (pixels: number, scale: number = 10): number => {
  return Math.round((pixels / scale) * 10) / 10;
};
