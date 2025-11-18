import { Point } from '../types';

/**
 * Calculate exponential function: y = base^x
 */
export const calculateExponential = (x: number, base: number): number => {
  return Math.pow(base, x);
};

/**
 * Calculate logarithmic function: y = log_base(x)
 */
export const calculateLogarithm = (x: number, base: number): number => {
  if (x <= 0) return NaN;
  return Math.log(x) / Math.log(base);
};

/**
 * Generate points for exponential curve
 */
export const generateExponentialPoints = (
  xMin: number,
  xMax: number,
  base: number,
  step: number = 0.05
): Point[] => {
  const points: Point[] = [];

  for (let x = xMin; x <= xMax; x += step) {
    const y = calculateExponential(x, base);

    // Only add points within reasonable range
    if (y > -1000 && y < 1000) {
      points.push({ x, y });
    }
  }

  return points;
};

/**
 * Generate points for logarithmic curve
 */
export const generateLogarithmicPoints = (
  xMax: number,
  base: number,
  step: number = 0.05
): Point[] => {
  const points: Point[] = [];

  // Logarithm only defined for x > 0
  const maxX = Math.exp(xMax);

  for (let x = 0.01; x <= maxX; x += step) {
    const y = calculateLogarithm(x, base);

    if (!isNaN(y) && isFinite(y)) {
      points.push({ x, y });
    }
  }

  return points;
};

/**
 * Convert math coordinates to screen coordinates
 */
export const toScreenCoords = (
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  scale: number
): Point => {
  return {
    x: centerX + x * scale,
    y: centerY - y * scale  // Flip Y axis
  };
};

/**
 * Convert screen coordinates to math coordinates
 */
export const toMathCoords = (
  screenX: number,
  screenY: number,
  centerX: number,
  centerY: number,
  scale: number
): Point => {
  return {
    x: (screenX - centerX) / scale,
    y: -(screenY - centerY) / scale  // Flip Y axis
  };
};

/**
 * Check if a point is within canvas bounds
 */
export const isPointInBounds = (
  point: Point,
  width: number,
  height: number,
  margin: number = 0
): boolean => {
  return (
    point.x >= -margin &&
    point.x <= width + margin &&
    point.y >= -margin &&
    point.y <= height + margin
  );
};

/**
 * Get base number display string
 */
export const getBaseDisplay = (base: number): string => {
  if (Math.abs(base - Math.E) < 0.001) return 'e';
  if (base === 10) return '10';
  if (base === 2) return '2';
  return base.toFixed(2);
};

/**
 * Get function label for display
 */
export const getFunctionLabel = (type: 'exp' | 'log', base: number): string => {
  const baseStr = getBaseDisplay(base);

  if (type === 'exp') {
    return baseStr === 'e' ? 'y = eˣ' : `y = ${baseStr}ˣ`;
  } else {
    return baseStr === 'e' ? 'y = ln(x)' : `y = log₍${baseStr}₎(x)`;
  }
};

/**
 * Clamp a value between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Linear interpolation
 */
export const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t;
};
