import { derivative, parse } from 'mathjs';

/**
 * 그래프의 수학적 성질을 분석하는 유틸리티
 */

/**
 * 주어진 x 값에서 함수의 1차 도함수 값을 계산
 */
export function getFirstDerivative(equation, x) {
  try {
    const expr = parse(equation);
    const derivative1 = derivative(expr, 'x');
    const compiled = derivative1.compile();
    return compiled.evaluate({ x });
  } catch (error) {
    console.error('1차 도함수 계산 오류:', error);
    return 0;
  }
}

/**
 * 주어진 x 값에서 함수의 2차 도함수 값을 계산
 */
export function getSecondDerivative(equation, x) {
  try {
    const expr = parse(equation);
    const derivative1 = derivative(expr, 'x');
    const derivative2 = derivative(derivative1, 'x');
    const compiled = derivative2.compile();
    return compiled.evaluate({ x });
  } catch (error) {
    console.error('2차 도함수 계산 오류:', error);
    return 0;
  }
}

/**
 * 함수가 증가하는지 감소하는지 판단
 */
export function getIncreasingDecreasing(equation, x) {
  const derivative1 = getFirstDerivative(equation, x);
  const threshold = 0.01; // 작은 임계값 설정

  if (Math.abs(derivative1) < threshold) {
    return 'stationary'; // 정류점 (극값 가능)
  } else if (derivative1 > 0) {
    return 'increasing'; // 증가
  } else {
    return 'decreasing'; // 감소
  }
}

/**
 * 극값 여부 판단 (1차 도함수가 0이고 2차 도함수가 0이 아님)
 */
export function isExtremum(equation, x) {
  const derivative1 = getFirstDerivative(equation, x);
  const derivative2 = getSecondDerivative(equation, x);
  const threshold = 0.01;

  if (Math.abs(derivative1) < threshold && Math.abs(derivative2) > threshold) {
    if (derivative2 < 0) {
      return 'maximum'; // 극대
    } else {
      return 'minimum'; // 극소
    }
  }
  return null;
}

/**
 * 변곡점 여부 판단 (2차 도함수가 0 또는 부호 변경)
 */
export function isInflectionPoint(equation, x, prevX) {
  if (prevX === null) return false;

  const derivative2Current = getSecondDerivative(equation, x);
  const derivative2Prev = getSecondDerivative(equation, prevX);
  const threshold = 0.01;

  // 2차 도함수의 부호가 바뀌면 변곡점
  if (Math.abs(derivative2Current) < threshold) {
    return true;
  }

  if ((derivative2Current > 0 && derivative2Prev < 0) ||
      (derivative2Current < 0 && derivative2Prev > 0)) {
    return true;
  }

  return false;
}

/**
 * 그래프의 성질 변화 감지
 * @param {string} equation - 수식
 * @param {number} currentX - 현재 x 값
 * @param {number} previousX - 이전 x 값
 * @returns {object} - 변화 정보
 */
export function detectPropertyChange(equation, currentX, previousX) {
  if (previousX === null) {
    return {
      hasChange: false,
      type: null,
      description: ''
    };
  }

  const currentState = getIncreasingDecreasing(equation, currentX);
  const previousState = getIncreasingDecreasing(equation, previousX);

  // 증가/감소 상태 변화
  if (currentState !== previousState &&
      currentState !== 'stationary' &&
      previousState !== 'stationary') {
    return {
      hasChange: true,
      type: 'slope_change',
      description: `${previousState === 'increasing' ? '증가' : '감소'}에서 ${currentState === 'increasing' ? '증가' : '감소'}로 변경`,
      vibrationPattern: [100, 50, 100] // 중간 강도 진동
    };
  }

  // 극값 감지
  const extremum = isExtremum(equation, currentX);
  if (extremum) {
    return {
      hasChange: true,
      type: 'extremum',
      subType: extremum,
      description: extremum === 'maximum' ? '극댓값 도달' : '극솟값 도달',
      vibrationPattern: [200, 100, 200, 100, 200] // 강한 진동
    };
  }

  // 변곡점 감지
  if (isInflectionPoint(equation, currentX, previousX)) {
    return {
      hasChange: true,
      type: 'inflection',
      description: '변곡점 통과',
      vibrationPattern: [150, 75, 150] // 중강도 진동
    };
  }

  return {
    hasChange: false,
    type: null,
    description: ''
  };
}

/**
 * 함수 값 계산
 */
export function evaluateFunction(equation, x) {
  try {
    const expr = parse(equation);
    const compiled = expr.compile();
    return compiled.evaluate({ x });
  } catch (error) {
    console.error('함수 계산 오류:', error);
    return 0;
  }
}

/**
 * 주어진 범위에서 함수의 최대/최소값 찾기
 */
export function getFunctionRange(equation, xMin, xMax, steps = 100) {
  const values = [];
  const step = (xMax - xMin) / steps;

  for (let i = 0; i <= steps; i++) {
    const x = xMin + i * step;
    const y = evaluateFunction(equation, x);
    if (isFinite(y)) {
      values.push(y);
    }
  }

  return {
    min: Math.min(...values),
    max: Math.max(...values)
  };
}
