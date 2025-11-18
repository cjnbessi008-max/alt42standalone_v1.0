import { Vector2D, LinearCombination } from '../types/vector';

/**
 * Add two vectors
 */
export const addVectors = (v1: Vector2D, v2: Vector2D): Vector2D => ({
  x: v1.x + v2.x,
  y: v1.y + v2.y,
});

/**
 * Subtract two vectors (v1 - v2)
 */
export const subtractVectors = (v1: Vector2D, v2: Vector2D): Vector2D => ({
  x: v1.x - v2.x,
  y: v1.y - v2.y,
});

/**
 * Multiply a vector by a scalar
 */
export const scaleVector = (v: Vector2D, scalar: number): Vector2D => ({
  x: v.x * scalar,
  y: v.y * scalar,
});

/**
 * Calculate the magnitude (length) of a vector
 */
export const magnitude = (v: Vector2D): number =>
  Math.sqrt(v.x * v.x + v.y * v.y);

/**
 * Calculate the dot product of two vectors
 */
export const dotProduct = (v1: Vector2D, v2: Vector2D): number =>
  v1.x * v2.x + v1.y * v2.y;

/**
 * Normalize a vector (make it unit length)
 */
export const normalize = (v: Vector2D): Vector2D => {
  const mag = magnitude(v);
  if (mag === 0) return { x: 0, y: 0 };
  return {
    x: v.x / mag,
    y: v.y / mag,
  };
};

/**
 * Calculate a linear combination of vectors
 * Result = c1*v1 + c2*v2 + ... + cn*vn
 */
export const linearCombination = (combo: LinearCombination): Vector2D => {
  const { coefficients, vectors } = combo;

  if (coefficients.length !== vectors.length) {
    throw new Error('Number of coefficients must match number of vectors');
  }

  return vectors.reduce((result, vector, index) => {
    const scaled = scaleVector(vector, coefficients[index]);
    return addVectors(result, scaled);
  }, { x: 0, y: 0 });
};

/**
 * Convert a vector to screen coordinates
 */
export const toScreenCoords = (
  v: Vector2D,
  centerX: number,
  centerY: number,
  scale: number
): { x: number; y: number } => ({
  x: centerX + v.x * scale,
  y: centerY - v.y * scale, // Flip y-axis for screen coordinates
});

/**
 * Convert screen coordinates to vector space
 */
export const fromScreenCoords = (
  screenX: number,
  screenY: number,
  centerX: number,
  centerY: number,
  scale: number
): Vector2D => ({
  x: (screenX - centerX) / scale,
  y: (centerY - screenY) / scale, // Flip y-axis back
});
