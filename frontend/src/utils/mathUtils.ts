import { evaluate } from 'mathjs';
import type { Point } from '../types/problem';

/**
 * Evaluate a mathematical function at a given x value
 */
export const evaluateFunction = (expression: string, x: number): number | null => {
  try {
    const result = evaluate(expression, { x });
    return typeof result === 'number' && isFinite(result) ? result : null;
  } catch (error) {
    console.error('Error evaluating function:', error);
    return null;
  }
};

/**
 * Generate points for plotting a function
 */
export const generateFunctionPoints = (
  expression: string,
  xMin: number,
  xMax: number,
  numPoints: number = 100
): Point[] => {
  const points: Point[] = [];
  const step = (xMax - xMin) / numPoints;

  for (let i = 0; i <= numPoints; i++) {
    const x = xMin + i * step;
    const y = evaluateFunction(expression, x);

    if (y !== null) {
      points.push({ x, y });
    }
  }

  return points;
};

/**
 * Reflect a point across the y=x line
 */
export const reflectPointAcrossYX = (point: Point): Point => {
  return { x: point.y, y: point.x };
};

/**
 * Find the projection of a point onto the y=x line
 */
export const projectOntoYXLine = (point: Point): Point => {
  const avg = (point.x + point.y) / 2;
  return { x: avg, y: avg };
};

/**
 * Calculate distance between two points
 */
export const distance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

/**
 * Find the closest point on a curve to a given point
 */
export const findClosestPoint = (points: Point[], target: Point): Point => {
  let closest = points[0];
  let minDist = distance(points[0], target);

  for (const point of points) {
    const dist = distance(point, target);
    if (dist < minDist) {
      minDist = dist;
      closest = point;
    }
  }

  return closest;
};

/**
 * Verify inverse function relationship
 */
export const verifyInverse = (
  originalFunc: string,
  inverseFunc: string,
  testX: number
): boolean => {
  try {
    const y = evaluateFunction(originalFunc, testX);
    if (y === null) return false;

    const xReconstructed = evaluateFunction(inverseFunc, y);
    if (xReconstructed === null) return false;

    const tolerance = 0.001;
    return Math.abs(xReconstructed - testX) < tolerance;
  } catch {
    return false;
  }
};

/**
 * Format number for display
 */
export const formatNumber = (num: number, decimals: number = 2): string => {
  return num.toFixed(decimals);
};
