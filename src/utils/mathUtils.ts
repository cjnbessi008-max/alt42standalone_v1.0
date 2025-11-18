import { derivative, parse, compile, MathNode } from 'mathjs';

export interface Point {
  x: number;
  y: number;
}

export interface FunctionData {
  expression: string;
  compiledFn: (x: number) => number;
  derivativeFn: (x: number) => number;
  derivativeExpression: string;
}

/**
 * 함수 표현식을 파싱하고 미분 함수를 생성합니다
 * @param expression 함수 표현식 (예: "x^2 + 2*x + 1")
 * @returns FunctionData 객체
 */
export function parseFunction(expression: string): FunctionData {
  try {
    // 수식 파싱
    const node: MathNode = parse(expression);

    // 원함수 컴파일
    const compiledFn = compile(expression);

    // 미분 계산
    const derivativeNode = derivative(node, 'x');
    const derivativeExpr = derivativeNode.toString();
    const derivativeCompiled = derivativeNode.compile();

    return {
      expression,
      compiledFn: (x: number) => {
        try {
          return compiledFn.evaluate({ x }) as number;
        } catch {
          return NaN;
        }
      },
      derivativeFn: (x: number) => {
        try {
          return derivativeCompiled.evaluate({ x }) as number;
        } catch {
          return NaN;
        }
      },
      derivativeExpression: derivativeExpr
    };
  } catch (error) {
    throw new Error(`함수 파싱 실패: ${error}`);
  }
}

/**
 * 특정 점에서의 접선 방정식을 계산합니다
 * @param fn 함수 데이터
 * @param x0 접점의 x 좌표
 * @returns 접선 함수 (y = mx + b 형태)
 */
export function getTangentLine(fn: FunctionData, x0: number): {
  slope: number;
  intercept: number;
  equation: string;
  point: Point;
} {
  const y0 = fn.compiledFn(x0);
  const slope = fn.derivativeFn(x0);
  const intercept = y0 - slope * x0;

  // 접선 방정식 문자열 생성
  let equation = 'y = ';
  if (Math.abs(slope) > 0.001) {
    equation += `${slope.toFixed(3)}x`;
    if (intercept >= 0) {
      equation += ` + ${intercept.toFixed(3)}`;
    } else {
      equation += ` - ${Math.abs(intercept).toFixed(3)}`;
    }
  } else {
    equation += `${y0.toFixed(3)}`;
  }

  return {
    slope,
    intercept,
    equation,
    point: { x: x0, y: y0 }
  };
}

/**
 * 함수의 정의역 내에서 샘플 포인트를 생성합니다
 * @param fn 함수
 * @param xMin 최소 x 값
 * @param xMax 최대 x 값
 * @param numPoints 포인트 개수
 * @returns Point 배열
 */
export function sampleFunction(
  fn: (x: number) => number,
  xMin: number,
  xMax: number,
  numPoints: number
): Point[] {
  const points: Point[] = [];
  const step = (xMax - xMin) / (numPoints - 1);

  for (let i = 0; i < numPoints; i++) {
    const x = xMin + i * step;
    const y = fn(x);
    if (!isNaN(y) && isFinite(y)) {
      points.push({ x, y });
    }
  }

  return points;
}

/**
 * 기본 제공 함수 목록
 */
export const PRESET_FUNCTIONS = [
  { name: '2차 함수', expression: 'x^2 - 2*x + 1', description: 'f(x) = x² - 2x + 1' },
  { name: '3차 함수', expression: 'x^3 - 3*x^2 + 2', description: 'f(x) = x³ - 3x² + 2' },
  { name: '삼각함수', expression: 'sin(x)', description: 'f(x) = sin(x)' },
  { name: '지수함수', expression: 'e^x', description: 'f(x) = eˣ' },
  { name: '분수함수', expression: '1/x', description: 'f(x) = 1/x' },
  { name: '복합함수', expression: 'x^2 * sin(x)', description: 'f(x) = x² · sin(x)' }
];
