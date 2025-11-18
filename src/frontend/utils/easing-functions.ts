/**
 * Easing Functions for Shape Morph Animation
 *
 * 다양한 easing 함수를 제공하여 애니메이션의 가속/감속 효과를 조절합니다.
 * 모든 함수는 0.0 ~ 1.0 사이의 값을 받아 0.0 ~ 1.0 사이의 값을 반환합니다.
 */

import { EasingFunction } from '@types/shape.types';

type EasingFn = (t: number) => number;

/**
 * Linear - 선형 (일정한 속도)
 */
export const linear: EasingFn = (t: number): number => t;

/**
 * Ease In - 천천히 시작
 */
export const easeIn: EasingFn = (t: number): number => t * t;

/**
 * Ease Out - 천천히 끝
 */
export const easeOut: EasingFn = (t: number): number => t * (2 - t);

/**
 * Ease In Out - 천천히 시작하고 천천히 끝
 */
export const easeInOut: EasingFn = (t: number): number =>
  t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

/**
 * Ease In Cubic - 큐빅 가속
 */
export const easeInCubic: EasingFn = (t: number): number => t * t * t;

/**
 * Ease Out Cubic - 큐빅 감속
 */
export const easeOutCubic: EasingFn = (t: number): number => {
  const t1 = t - 1;
  return t1 * t1 * t1 + 1;
};

/**
 * Ease In Out Cubic - 큐빅 가속/감속
 */
export const easeInOutCubic: EasingFn = (t: number): number =>
  t < 0.5
    ? 4 * t * t * t
    : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

/**
 * Bounce - 탄성 효과
 */
export const bounce: EasingFn = (t: number): number => {
  if (t < 1 / 2.75) {
    return 7.5625 * t * t;
  } else if (t < 2 / 2.75) {
    const t2 = t - 1.5 / 2.75;
    return 7.5625 * t2 * t2 + 0.75;
  } else if (t < 2.5 / 2.75) {
    const t2 = t - 2.25 / 2.75;
    return 7.5625 * t2 * t2 + 0.9375;
  } else {
    const t2 = t - 2.625 / 2.75;
    return 7.5625 * t2 * t2 + 0.984375;
  }
};

/**
 * Elastic - 탄성 진동 효과
 */
export const elastic: EasingFn = (t: number): number => {
  if (t === 0 || t === 1) return t;

  const p = 0.3;
  const s = p / 4;
  const t1 = t - 1;

  return -(Math.pow(2, 10 * t1) * Math.sin(((t1 - s) * (2 * Math.PI)) / p));
};

/**
 * Easing 함수 맵
 */
const easingFunctionMap: Record<EasingFunction, EasingFn> = {
  linear,
  'ease-in': easeIn,
  'ease-out': easeOut,
  'ease-in-out': easeInOut,
  'ease-in-cubic': easeInCubic,
  'ease-out-cubic': easeOutCubic,
  'ease-in-out-cubic': easeInOutCubic,
  bounce,
  elastic,
};

/**
 * Easing 함수 가져오기
 */
export function getEasingFunction(name: EasingFunction): EasingFn {
  return easingFunctionMap[name] || linear;
}

/**
 * 커스텀 베지어 easing 함수 생성
 */
export function createBezierEasing(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): EasingFn {
  return (t: number): number => {
    // Cubic Bezier 곡선 근사치 계산
    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;

    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;

    const sampleCurveX = (t: number) => ((ax * t + bx) * t + cx) * t;
    const sampleCurveY = (t: number) => ((ay * t + by) * t + cy) * t;

    // Newton-Raphson 방법으로 t 값 찾기
    let t2 = t;
    for (let i = 0; i < 8; i++) {
      const x = sampleCurveX(t2) - t;
      if (Math.abs(x) < 0.001) break;

      const d = 3 * ax * t2 * t2 + 2 * bx * t2 + cx;
      if (Math.abs(d) < 0.000001) break;

      t2 = t2 - x / d;
    }

    return sampleCurveY(t2);
  };
}
