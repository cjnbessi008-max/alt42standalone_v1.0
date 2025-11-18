import { EquationParams, GraphData, Point } from '../types/equation.types';
import { solveEquation } from './equationSolver';

export const generateGraphData = (
  equation: EquationParams,
  numPoints: number = 200
): GraphData => {
  const { xMin = -10, xMax = 10 } = equation;
  const step = (xMax - xMin) / numPoints;
  const points: Point[] = [];

  for (let i = 0; i <= numPoints; i++) {
    const x = xMin + i * step;
    const y = solveEquation(equation, x);

    if (y !== null && !isNaN(y) && isFinite(y)) {
      points.push({ x, y });
    }
  }

  // 원의 경우 하단 반원도 추가
  if (equation.type === 'circle') {
    const { h = 0, k = 0, r = 1 } = equation;
    const lowerPoints: Point[] = [];

    for (let i = 0; i <= numPoints; i++) {
      const x = xMin + i * step;
      const underSqrt = r * r - (x - h) * (x - h);

      if (underSqrt >= 0) {
        const y = k - Math.sqrt(underSqrt); // 하단 반원
        if (!isNaN(y) && isFinite(y)) {
          lowerPoints.push({ x, y });
        }
      }
    }

    points.push(...lowerPoints.reverse());
  }

  return {
    points,
    equation,
  };
};

export const findClosestPoint = (
  points: Point[],
  targetX: number,
  targetY: number
): Point | null => {
  if (points.length === 0) return null;

  let closest = points[0];
  let minDistance = Infinity;

  for (const point of points) {
    const distance = Math.sqrt(
      Math.pow(point.x - targetX, 2) + Math.pow(point.y - targetY, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      closest = point;
    }
  }

  return closest;
};
