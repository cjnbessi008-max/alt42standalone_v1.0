/**
 * Vector Blend LMS - Vector Mathematics Engine
 * Core vector operations for 2D vector mathematics
 */

import type { Vector2D, VectorMath } from '../types/vector';

/**
 * Add two or more vectors
 */
export function addVectors(...vectors: Vector2D[]): Vector2D {
  if (vectors.length === 0) {
    throw new Error('At least one vector is required');
  }

  const sum = vectors.reduce(
    (acc, v) => ({
      x: acc.x + v.x,
      y: acc.y + v.y,
    }),
    { x: 0, y: 0 }
  );

  // Result vector doesn't have a color yet (will be calculated separately)
  return {
    x: sum.x,
    y: sum.y,
    color: { r: 0, g: 0, b: 0 },
    label: 'Result',
  };
}

/**
 * Subtract vector b from vector a
 */
export function subtractVectors(a: Vector2D, b: Vector2D): Vector2D {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    color: { r: 0, g: 0, b: 0 },
  };
}

/**
 * Multiply vector by scalar
 */
export function scaleVector(v: Vector2D, scalar: number): Vector2D {
  return {
    x: v.x * scalar,
    y: v.y * scalar,
    color: v.color,
    label: v.label,
  };
}

/**
 * Calculate magnitude (length) of a vector
 */
export function magnitude(v: Vector2D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * Calculate angle of a vector in radians
 */
export function angle(v: Vector2D): number {
  return Math.atan2(v.y, v.x);
}

/**
 * Calculate angle of a vector in degrees
 */
export function angleInDegrees(v: Vector2D): number {
  return (angle(v) * 180) / Math.PI;
}

/**
 * Get vector math properties
 */
export function getVectorMath(v: Vector2D): VectorMath {
  return {
    magnitude: magnitude(v),
    angle: angle(v),
    angleInDegrees: angleInDegrees(v),
  };
}

/**
 * Normalize a vector (make it unit length)
 */
export function normalize(v: Vector2D): Vector2D {
  const mag = magnitude(v);
  if (mag === 0) {
    return { x: 0, y: 0, color: v.color, label: v.label };
  }
  return {
    x: v.x / mag,
    y: v.y / mag,
    color: v.color,
    label: v.label,
  };
}

/**
 * Calculate dot product of two vectors
 */
export function dotProduct(a: Vector2D, b: Vector2D): number {
  return a.x * b.x + a.y * b.y;
}

/**
 * Calculate cross product magnitude (z-component) of two 2D vectors
 */
export function crossProductZ(a: Vector2D, b: Vector2D): number {
  return a.x * b.y - a.y * b.x;
}

/**
 * Calculate distance between two vectors
 */
export function distance(a: Vector2D, b: Vector2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if two vectors are approximately equal
 */
export function areVectorsEqual(
  a: Vector2D,
  b: Vector2D,
  tolerance: number = 0.01
): boolean {
  return distance(a, b) <= tolerance;
}

/**
 * Rotate a vector by angle (in radians)
 */
export function rotateVector(v: Vector2D, angleRad: number): Vector2D {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos,
    color: v.color,
    label: v.label,
  };
}

/**
 * Create a vector from magnitude and angle
 */
export function fromPolar(magnitude: number, angleRad: number): Vector2D {
  return {
    x: magnitude * Math.cos(angleRad),
    y: magnitude * Math.sin(angleRad),
    color: { r: 128, g: 128, b: 128 },
  };
}

/**
 * Convert vector to polar coordinates
 */
export function toPolar(v: Vector2D): { magnitude: number; angle: number } {
  return {
    magnitude: magnitude(v),
    angle: angle(v),
  };
}
