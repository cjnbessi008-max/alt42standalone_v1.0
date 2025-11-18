import { DistributionParams, DistributionPoint } from '../types';

// Helper function: Normal distribution PDF
function normalPDF(x: number, mean: number, stdDev: number): number {
  const coefficient = 1 / (stdDev * Math.sqrt(2 * Math.PI));
  const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
  return coefficient * Math.exp(exponent);
}

// Helper function: Uniform distribution PDF
function uniformPDF(x: number, min: number, max: number): number {
  return x >= min && x <= max ? 1 / (max - min) : 0;
}

// Helper function: Binomial distribution PMF
function binomialPMF(k: number, n: number, p: number): number {
  const binomCoeff = factorial(n) / (factorial(k) * factorial(n - k));
  return binomCoeff * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

// Helper function: Exponential distribution PDF
function exponentialPDF(x: number, lambda: number): number {
  return x >= 0 ? lambda * Math.exp(-lambda * x) : 0;
}

// Helper function: Poisson distribution PMF
function poissonPMF(k: number, lambda: number): number {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

// Helper function: Factorial
function factorial(n: number): number {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

/**
 * Generate distribution points based on parameters
 */
export function generateDistribution(
  params: DistributionParams,
  numPoints: number = 200
): DistributionPoint[] {
  const points: DistributionPoint[] = [];

  switch (params.type) {
    case 'normal': {
      const mean = params.mean ?? 0;
      const stdDev = params.stdDev ?? 1;
      const xMin = mean - 4 * stdDev;
      const xMax = mean + 4 * stdDev;
      const step = (xMax - xMin) / numPoints;

      for (let i = 0; i <= numPoints; i++) {
        const x = xMin + i * step;
        const y = normalPDF(x, mean, stdDev);
        points.push({ x, y });
      }
      break;
    }

    case 'uniform': {
      const min = params.min ?? 0;
      const max = params.max ?? 1;
      const padding = (max - min) * 0.2;
      const xMin = min - padding;
      const xMax = max + padding;
      const step = (xMax - xMin) / numPoints;

      for (let i = 0; i <= numPoints; i++) {
        const x = xMin + i * step;
        const y = uniformPDF(x, min, max);
        points.push({ x, y });
      }
      break;
    }

    case 'binomial': {
      const n = params.n ?? 10;
      const p = params.p ?? 0.5;

      for (let k = 0; k <= n; k++) {
        const y = binomialPMF(k, n, p);
        points.push({ x: k, y });
      }
      break;
    }

    case 'exponential': {
      const lambda = params.lambda ?? 1;
      const xMax = 5 / lambda;
      const step = xMax / numPoints;

      for (let i = 0; i <= numPoints; i++) {
        const x = i * step;
        const y = exponentialPDF(x, lambda);
        points.push({ x, y });
      }
      break;
    }

    case 'poisson': {
      const lambda = params.lambda ?? 3;
      const maxK = Math.ceil(lambda + 4 * Math.sqrt(lambda));

      for (let k = 0; k <= maxK; k++) {
        const y = poissonPMF(k, lambda);
        points.push({ x: k, y });
      }
      break;
    }
  }

  return points;
}

/**
 * Interpolate between two distributions
 */
export function interpolateDistributions(
  from: DistributionPoint[],
  to: DistributionPoint[],
  progress: number
): DistributionPoint[] {
  // Ensure both arrays have the same length
  const maxLength = Math.max(from.length, to.length);
  const fromPadded = padArray(from, maxLength);
  const toPadded = padArray(to, maxLength);

  return fromPadded.map((point, i) => ({
    x: point.x + (toPadded[i].x - point.x) * progress,
    y: point.y + (toPadded[i].y - point.y) * progress,
  }));
}

/**
 * Pad array to target length
 */
function padArray(
  arr: DistributionPoint[],
  targetLength: number
): DistributionPoint[] {
  if (arr.length >= targetLength) return arr;

  const padded = [...arr];
  const lastPoint = arr[arr.length - 1];

  while (padded.length < targetLength) {
    padded.push({ ...lastPoint, y: 0 });
  }

  return padded;
}
