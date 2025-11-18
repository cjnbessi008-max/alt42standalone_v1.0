import { derivative, parse } from 'mathjs';
import type { MathFunction, GraphPoint } from '../types';

/**
 * 수학 표현식의 미분을 계산합니다
 */
export function calculateDerivative(expression: string): string {
  try {
    const parsed = parse(expression);
    const derived = derivative(parsed, 'x');
    return derived.toString();
  } catch (error) {
    console.error('미분 계산 오류:', error);
    return '0';
  }
}

/**
 * 함수의 그래프 포인트를 생성합니다
 */
export function generateGraphPoints(
  expression: string,
  xMin: number = -10,
  xMax: number = 10,
  steps: number = 200
): GraphPoint[] {
  const points: GraphPoint[] = [];
  const dx = (xMax - xMin) / steps;

  try {
    const parsed = parse(expression);
    const compiled = parsed.compile();

    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * dx;
      const y = compiled.evaluate({ x });

      // NaN이나 Infinity 체크
      if (isFinite(y)) {
        points.push({ x, y });
      }
    }
  } catch (error) {
    console.error('그래프 포인트 생성 오류:', error);
  }

  return points;
}

/**
 * 미분 함수 객체를 생성합니다
 */
export function deriveFunction(func: MathFunction): MathFunction {
  const derivedExpression = calculateDerivative(func.expression);

  return {
    id: `${func.id}_derivative`,
    expression: derivedExpression,
    label: `${func.label}'`,
    color: '#ff6b6b', // 미분 함수는 빨간색으로 표시
  };
}
