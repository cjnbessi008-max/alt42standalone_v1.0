/**
 * Vector Mathematics Utilities
 * Core 2D vector operations for drag and visualization
 */

import { Vector2D } from '../types/vector.types';

/**
 * Add two vectors
 */
export function addVectors(a: Vector2D, b: Vector2D): Vector2D {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
  };
}

/**
 * Subtract vector b from vector a
 */
export function subtractVectors(a: Vector2D, b: Vector2D): Vector2D {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
  };
}

/**
 * Scale a vector by a scalar value
 */
export function scaleVector(v: Vector2D, scale: number): Vector2D {
  return {
    x: v.x * scale,
    y: v.y * scale,
  };
}

/**
 * Calculate the magnitude (length) of a vector
 */
export function magnitude(v: Vector2D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * Normalize a vector (make it unit length)
 */
export function normalize(v: Vector2D): Vector2D {
  const mag = magnitude(v);
  if (mag === 0) return { x: 0, y: 0 };
  return {
    x: v.x / mag,
    y: v.y / mag,
  };
}

/**
 * Calculate dot product of two vectors
 */
export function dotProduct(a: Vector2D, b: Vector2D): number {
  return a.x * b.x + a.y * b.y;
}

/**
 * Calculate the angle between two vectors in radians
 */
export function angleBetween(a: Vector2D, b: Vector2D): number {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return Math.acos(dotProduct(a, b) / (magA * magB));
}

/**
 * Rotate a vector by an angle (in radians)
 */
export function rotateVector(v: Vector2D, angle: number): Vector2D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos,
  };
}

/**
 * Calculate distance between two points
 */
export function distance(a: Vector2D, b: Vector2D): number {
  return magnitude(subtractVectors(a, b));
}

/**
 * Linearly interpolate between two vectors
 */
export function lerp(a: Vector2D, b: Vector2D, t: number): Vector2D {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

/**
 * Clamp a vector within bounds
 */
export function clampVector(
  v: Vector2D,
  min: Vector2D,
  max: Vector2D
): Vector2D {
  return {
    x: Math.max(min.x, Math.min(max.x, v.x)),
    y: Math.max(min.y, Math.min(max.y, v.y)),
  };
}

/**
 * Snap vector to grid
 */
export function snapToGrid(v: Vector2D, gridSize: number): Vector2D {
  return {
    x: Math.round(v.x / gridSize) * gridSize,
    y: Math.round(v.y / gridSize) * gridSize,
  };
}

/**
 * Check if two vectors are approximately equal
 */
export function vectorsEqual(
  a: Vector2D,
  b: Vector2D,
  epsilon: number = 0.0001
): boolean {
  return Math.abs(a.x - b.x) < epsilon && Math.abs(a.y - b.y) < epsilon;
}

/**
 * Get angle of vector in radians (-PI to PI)
 */
export function getVectorAngle(v: Vector2D): number {
  return Math.atan2(v.y, v.x);
}

/**
 * Create vector from angle and magnitude
 */
export function fromPolar(angle: number, magnitude: number): Vector2D {
  return {
    x: Math.cos(angle) * magnitude,
    y: Math.sin(angle) * magnitude,
  };
}

/**
 * Project vector a onto vector b
 */
export function projectVector(a: Vector2D, b: Vector2D): Vector2D {
  const magB = magnitude(b);
  if (magB === 0) return { x: 0, y: 0 };
  const scalar = dotProduct(a, b) / (magB * magB);
  return scaleVector(b, scalar);
}
