/**
 * Calculate the numerical derivative of a function at a given point
 * Uses the central difference method for better accuracy
 */
export const calculateDerivative = (
  func: (x: number) => number,
  x: number,
  h: number = 0.0001
): number => {
  try {
    // Central difference: f'(x) ≈ [f(x+h) - f(x-h)] / (2h)
    const derivative = (func(x + h) - func(x - h)) / (2 * h);

    if (!isFinite(derivative)) {
      return 0;
    }

    return derivative;
  } catch (error) {
    console.error('Error calculating derivative:', error);
    return 0;
  }
};

/**
 * Generate derivative values over a range for visualization
 */
export const generateDerivativeData = (
  func: (x: number) => number,
  xMin: number,
  xMax: number,
  step: number = 0.1
): Array<{ x: number; derivative: number }> => {
  const data: Array<{ x: number; derivative: number }> = [];

  for (let x = xMin; x <= xMax; x += step) {
    const derivative = calculateDerivative(func, x);
    data.push({ x, derivative });
  }

  return data;
};

/**
 * Calculate the rate of change (derivative) at multiple points
 * to create a "wave" effect showing how the derivative changes
 */
export const calculateWaveDerivative = (
  func: (x: number) => number,
  centerX: number,
  range: number = 2,
  points: number = 50
): Array<{ x: number; y: number; derivative: number }> => {
  const data: Array<{ x: number; y: number; derivative: number }> = [];
  const step = (range * 2) / points;

  for (let i = 0; i < points; i++) {
    const x = centerX - range + i * step;
    const y = func(x);
    const derivative = calculateDerivative(func, x);

    if (isFinite(y) && isFinite(derivative)) {
      data.push({ x, y, derivative });
    }
  }

  return data;
};

/**
 * Normalize derivative values to create smooth wave visualization
 */
export const normalizeDerivatives = (
  derivatives: number[],
  targetRange: [number, number] = [-1, 1]
): number[] => {
  const min = Math.min(...derivatives);
  const max = Math.max(...derivatives);
  const range = max - min;

  if (range === 0) {
    return derivatives.map(() => 0);
  }

  const [targetMin, targetMax] = targetRange;
  const targetSpan = targetMax - targetMin;

  return derivatives.map(d =>
    ((d - min) / range) * targetSpan + targetMin
  );
};

/**
 * Common math functions for testing
 */
export const MathFunctions = {
  sine: (x: number) => Math.sin(x),
  cosine: (x: number) => Math.cos(x),
  quadratic: (x: number) => x * x,
  cubic: (x: number) => x * x * x,
  exponential: (x: number) => Math.exp(x / 2),
  logarithmic: (x: number) => x > 0 ? Math.log(x) : NaN,
  tangent: (x: number) => Math.tan(x),
  polynomial: (x: number) => 0.1 * x * x * x - 0.5 * x * x + x + 2,
};

/**
 * Get the derivative function for common functions (analytical)
 */
export const getAnalyticalDerivative = (
  functionName: keyof typeof MathFunctions
): ((x: number) => number) => {
  const derivatives = {
    sine: (x: number) => Math.cos(x),
    cosine: (x: number) => -Math.sin(x),
    quadratic: (x: number) => 2 * x,
    cubic: (x: number) => 3 * x * x,
    exponential: (x: number) => 0.5 * Math.exp(x / 2),
    logarithmic: (x: number) => x > 0 ? 1 / x : NaN,
    tangent: (x: number) => 1 / (Math.cos(x) * Math.cos(x)),
    polynomial: (x: number) => 0.3 * x * x - x + 1,
  };

  return derivatives[functionName];
};
