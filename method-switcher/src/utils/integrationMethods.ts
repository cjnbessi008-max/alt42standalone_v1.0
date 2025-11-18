import { IntegrationMethod, IntegrationResult, IntegrationStep } from '../types/integration';

// 수학 함수 파서 (간단한 구현)
export function parseFunction(expression: string): (x: number) => number {
  // 안전한 함수 파싱 (실제 프로덕션에서는 math.js 등 사용 권장)
  const safeExpression = expression
    .replace(/\^/g, '**')
    .replace(/sin/g, 'Math.sin')
    .replace(/cos/g, 'Math.cos')
    .replace(/tan/g, 'Math.tan')
    .replace(/sqrt/g, 'Math.sqrt')
    .replace(/log/g, 'Math.log')
    .replace(/exp/g, 'Math.exp');

  return (x: number) => {
    try {
      return eval(safeExpression.replace(/x/g, String(x)));
    } catch {
      return 0;
    }
  };
}

// 사다리꼴 법 (Trapezoidal Rule)
export function trapezoidalIntegration(
  fn: (x: number) => number,
  a: number,
  b: number,
  n: number = 100
): IntegrationResult {
  const startTime = performance.now();
  const h = (b - a) / n;
  const steps: IntegrationStep[] = [];
  let sum = 0;

  for (let i = 0; i <= n; i++) {
    const x = a + i * h;
    const y = fn(x);

    if (i === 0 || i === n) {
      sum += y;
    } else {
      sum += 2 * y;
    }

    steps.push({
      index: i,
      x,
      y,
      width: h,
      height: y,
      area: i < n ? h * (y + fn(x + h)) / 2 : 0
    });
  }

  const value = (h / 2) * sum;
  const computationTime = performance.now() - startTime;

  return {
    method: 'trapezoidal',
    value,
    steps,
    computationTime
  };
}

// 심슨 법 (Simpson's Rule)
export function simpsonIntegration(
  fn: (x: number) => number,
  a: number,
  b: number,
  n: number = 100
): IntegrationResult {
  const startTime = performance.now();
  // n은 짝수여야 함
  const nEven = n % 2 === 0 ? n : n + 1;
  const h = (b - a) / nEven;
  const steps: IntegrationStep[] = [];
  let sum = fn(a) + fn(b);

  for (let i = 1; i < nEven; i++) {
    const x = a + i * h;
    const y = fn(x);
    const coefficient = i % 2 === 0 ? 2 : 4;
    sum += coefficient * y;

    steps.push({
      index: i,
      x,
      y,
      width: h,
      height: y,
      area: 0 // Simpson은 포물선이므로 개별 넓이 계산 복잡
    });
  }

  const value = (h / 3) * sum;
  const computationTime = performance.now() - startTime;

  return {
    method: 'simpson',
    value,
    steps,
    computationTime
  };
}

// 직사각형 법 - 중점 (Midpoint Rectangle Rule)
export function rectangleIntegration(
  fn: (x: number) => number,
  a: number,
  b: number,
  n: number = 100
): IntegrationResult {
  const startTime = performance.now();
  const h = (b - a) / n;
  const steps: IntegrationStep[] = [];
  let sum = 0;

  for (let i = 0; i < n; i++) {
    const x = a + (i + 0.5) * h; // 중점 사용
    const y = fn(x);
    sum += y;

    steps.push({
      index: i,
      x: a + i * h,
      y,
      width: h,
      height: y,
      area: h * y
    });
  }

  const value = h * sum;
  const computationTime = performance.now() - startTime;

  return {
    method: 'rectangle',
    value,
    steps,
    computationTime
  };
}

// 몬테카를로 법 (Monte Carlo Integration)
export function monteCarloIntegration(
  fn: (x: number) => number,
  a: number,
  b: number,
  n: number = 1000
): IntegrationResult {
  const startTime = performance.now();
  const steps: IntegrationStep[] = [];
  let sum = 0;

  // y 범위 찾기
  const samples = 100;
  let yMax = 0;
  for (let i = 0; i < samples; i++) {
    const x = a + (b - a) * (i / samples);
    const y = Math.abs(fn(x));
    if (y > yMax) yMax = y;
  }
  yMax *= 1.1; // 여유 공간

  let hits = 0;
  for (let i = 0; i < n; i++) {
    const x = a + Math.random() * (b - a);
    const y = Math.random() * yMax;
    const fnValue = Math.abs(fn(x));

    const isInside = y <= fnValue;
    if (isInside) hits++;

    if (i < 200) { // 애니메이션용으로 처음 200개만 저장
      steps.push({
        index: i,
        x,
        y: isInside ? fnValue : y,
        area: isInside ? 1 : 0
      });
    }
  }

  const value = (hits / n) * (b - a) * yMax;
  const computationTime = performance.now() - startTime;

  return {
    method: 'monte-carlo',
    value,
    steps,
    computationTime
  };
}

// 통합 함수
export function calculateIntegration(
  method: IntegrationMethod,
  fn: (x: number) => number,
  a: number,
  b: number,
  n?: number
): IntegrationResult {
  switch (method) {
    case 'trapezoidal':
      return trapezoidalIntegration(fn, a, b, n);
    case 'simpson':
      return simpsonIntegration(fn, a, b, n);
    case 'rectangle':
      return rectangleIntegration(fn, a, b, n);
    case 'monte-carlo':
      return monteCarloIntegration(fn, a, b, n || 1000);
    default:
      throw new Error(`Unknown method: ${method}`);
  }
}
