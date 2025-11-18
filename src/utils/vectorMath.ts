/**
 * Vector mathematics utilities
 */

import { Vector, UnitVector } from '../types';

/**
 * Create a vector from x and y coordinates
 */
export function createVector(x: number, y: number): Vector {
  const magnitude = Math.sqrt(x * x + y * y);
  const angle = Math.atan2(y, x);
  return { x, y, magnitude, angle };
}

/**
 * Create a unit vector (normalized to magnitude 1)
 */
export function createUnitVector(x: number, y: number): UnitVector {
  const magnitude = Math.sqrt(x * x + y * y);
  if (magnitude === 0) {
    return { x: 0, y: 0, magnitude: 1, angle: 0 };
  }
  return {
    x: x / magnitude,
    y: y / magnitude,
    magnitude: 1,
    angle: Math.atan2(y, x),
  };
}

/**
 * Create a unit vector from angle (in radians)
 */
export function unitVectorFromAngle(angle: number): UnitVector {
  return {
    x: Math.cos(angle),
    y: Math.sin(angle),
    magnitude: 1,
    angle,
  };
}

/**
 * Normalize a vector to unit length
 */
export function normalize(vector: Vector): UnitVector {
  return createUnitVector(vector.x, vector.y);
}

/**
 * Add two vectors
 */
export function addVectors(v1: Vector, v2: Vector): Vector {
  return createVector(v1.x + v2.x, v1.y + v2.y);
}

/**
 * Subtract two vectors
 */
export function subtractVectors(v1: Vector, v2: Vector): Vector {
  return createVector(v1.x - v2.x, v1.y - v2.y);
}

/**
 * Scale a vector by a scalar
 */
export function scaleVector(vector: Vector, scalar: number): Vector {
  return createVector(vector.x * scalar, vector.y * scalar);
}

/**
 * Calculate dot product of two vectors
 */
export function dotProduct(v1: Vector, v2: Vector): number {
  return v1.x * v2.x + v1.y * v2.y;
}

/**
 * Calculate angle between two vectors (in radians)
 */
export function angleBetween(v1: Vector, v2: Vector): number {
  const dot = dotProduct(v1, v2);
  const mag = v1.magnitude * v2.magnitude;
  return Math.acos(dot / mag);
}

/**
 * Convert radians to degrees
 */
export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Convert degrees to radians
 */
export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Check if two vectors are approximately equal (with tolerance)
 */
export function vectorsEqual(v1: Vector, v2: Vector, tolerance: number = 0.01): boolean {
  return Math.abs(v1.x - v2.x) < tolerance && Math.abs(v1.y - v2.y) < tolerance;
}

/**
 * Check if angle is approximately equal to target (with tolerance in radians)
 */
export function anglesEqual(angle1: number, angle2: number, tolerance: number = 0.05): boolean {
  // Normalize angles to [0, 2π]
  const normalize = (a: number) => {
    while (a < 0) a += 2 * Math.PI;
    while (a >= 2 * Math.PI) a -= 2 * Math.PI;
    return a;
  };

  const a1 = normalize(angle1);
  const a2 = normalize(angle2);

  // Handle wraparound at 0/2π
  const diff = Math.abs(a1 - a2);
  return diff < tolerance || diff > (2 * Math.PI - tolerance);
}

/**
 * Format vector for display
 */
export function formatVector(vector: Vector, decimals: number = 2): string {
  return `(${vector.x.toFixed(decimals)}, ${vector.y.toFixed(decimals)})`;
}

/**
 * Format angle for display (in degrees)
 */
export function formatAngle(radians: number, decimals: number = 1): string {
  return `${radToDeg(radians).toFixed(decimals)}°`;
}
