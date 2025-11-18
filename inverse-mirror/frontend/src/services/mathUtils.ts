import { create, all } from 'mathjs';
import type { Point, FunctionData, TangentLine } from '../types';

const math = create(all);

/**
 * Evaluate a mathematical expression for a given x value
 */
export const evaluateFunction = (expression: string, x: number): number => {
  try {
    const node = math.parse(expression);
    const compiled = node.compile();
    return compiled.evaluate({ x });
  } catch (error) {
    console.error('Error evaluating function:', error);
    return NaN;
  }
};

/**
 * Generate points for a function over a domain
 */
export const generateFunctionPoints = (
  expression: string,
  domain: [number, number],
  numPoints: number = 200
): Point[] => {
  const [xMin, xMax] = domain;
  const step = (xMax - xMin) / numPoints;
  const points: Point[] = [];

  for (let i = 0; i <= numPoints; i++) {
    const x = xMin + i * step;
    const y = evaluateFunction(expression, x);
    if (!isNaN(y) && isFinite(y)) {
      points.push({ x, y });
    }
  }

  return points;
};

/**
 * Calculate numerical derivative at a point
 */
export const calculateDerivative = (expression: string, x: number, h: number = 0.0001): number => {
  const y1 = evaluateFunction(expression, x + h);
  const y2 = evaluateFunction(expression, x - h);
  return (y1 - y2) / (2 * h);
};

/**
 * Generate tangent line points
 */
export const generateTangentLine = (
  point: Point,
  slope: number,
  range: number = 2
): Point[] => {
  return [
    { x: point.x - range, y: point.y - slope * range },
    { x: point.x + range, y: point.y + slope * range },
  ];
};

/**
 * Calculate inverse function points (reflection over y=x)
 */
export const calculateInversePoints = (points: Point[]): Point[] => {
  return points.map(p => ({ x: p.y, y: p.x }));
};

/**
 * Generate y=x line for mirror effect
 */
export const generateMirrorLine = (domain: [number, number]): Point[] => {
  const [min, max] = domain;
  const range = Math.max(Math.abs(min), Math.abs(max)) * 1.5;
  return [
    { x: -range, y: -range },
    { x: range, y: range },
  ];
};

/**
 * Check if a function is invertible (strictly monotonic) in the given domain
 */
export const isInvertible = (expression: string, domain: [number, number]): boolean => {
  const points = generateFunctionPoints(expression, domain, 50);

  if (points.length < 2) return false;

  let increasing = true;
  let decreasing = true;

  for (let i = 1; i < points.length; i++) {
    if (points[i].y <= points[i - 1].y) increasing = false;
    if (points[i].y >= points[i - 1].y) decreasing = false;
  }

  return increasing || decreasing;
};
