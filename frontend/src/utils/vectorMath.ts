/**
 * Vector Mathematics Utilities
 * 벡터 계산을 위한 유틸리티 함수들
 */

import type { Vector2D, EasingFunction } from '../types/vector';

/**
 * 벡터의 크기(magnitude) 계산
 */
export function magnitude(v: Vector2D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * 벡터 정규화 (단위 벡터로 변환)
 */
export function normalize(v: Vector2D): Vector2D {
  const mag = magnitude(v);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: v.x / mag, y: v.y / mag };
}

/**
 * 벡터 덧셈
 */
export function add(v1: Vector2D, v2: Vector2D): Vector2D {
  return { x: v1.x + v2.x, y: v1.y + v2.y };
}

/**
 * 벡터 뺄셈
 */
export function subtract(v1: Vector2D, v2: Vector2D): Vector2D {
  return { x: v1.x - v2.x, y: v1.y - v2.y };
}

/**
 * 벡터 스칼라 곱
 */
export function multiply(v: Vector2D, scalar: number): Vector2D {
  return { x: v.x * scalar, y: v.y * scalar };
}

/**
 * 벡터 내적 (dot product)
 */
export function dot(v1: Vector2D, v2: Vector2D): number {
  return v1.x * v2.x + v1.y * v2.y;
}

/**
 * 벡터 외적의 z 성분 (2D에서 스칼라 값)
 */
export function cross(v1: Vector2D, v2: Vector2D): number {
  return v1.x * v2.y - v1.y * v2.x;
}

/**
 * 벡터의 각도 계산 (라디안)
 */
export function angle(v: Vector2D): number {
  return Math.atan2(v.y, v.x);
}

/**
 * 두 벡터 사이의 각도 계산 (라디안)
 */
export function angleBetween(v1: Vector2D, v2: Vector2D): number {
  return Math.acos(dot(normalize(v1), normalize(v2)));
}

/**
 * 벡터 회전
 */
export function rotate(v: Vector2D, angleRad: number): Vector2D {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos,
  };
}

/**
 * 두 점 사이의 거리 계산
 */
export function distance(v1: Vector2D, v2: Vector2D): number {
  return magnitude(subtract(v2, v1));
}

/**
 * 선형 보간 (Linear Interpolation)
 */
export function lerp(v1: Vector2D, v2: Vector2D, t: number): Vector2D {
  return {
    x: v1.x + (v2.x - v1.x) * t,
    y: v1.y + (v2.y - v1.y) * t,
  };
}

/**
 * 각도를 도(degree)에서 라디안(radian)으로 변환
 */
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * 각도를 라디안(radian)에서 도(degree)로 변환
 */
export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Easing Functions for smooth animations
 */
export const easing = {
  linear: (t: number): number => t,

  easeInQuad: (t: number): number => t * t,

  easeOutQuad: (t: number): number => t * (2 - t),

  easeInOutQuad: (t: number): number =>
    t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

  easeInCubic: (t: number): number => t * t * t,

  easeOutCubic: (t: number): number => {
    const t1 = t - 1;
    return t1 * t1 * t1 + 1;
  },

  easeInOutCubic: (t: number): number =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  easeInElastic: (t: number): number => {
    if (t === 0 || t === 1) return t;
    const p = 0.3;
    const s = p / 4;
    const t1 = t - 1;
    return -(Math.pow(2, 10 * t1) * Math.sin((t1 - s) * (2 * Math.PI) / p));
  },

  easeOutElastic: (t: number): number => {
    if (t === 0 || t === 1) return t;
    const p = 0.3;
    const s = p / 4;
    return Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
  },
};

/**
 * 베지어 곡선을 따라 벡터를 보간
 */
export function bezierLerp(
  start: Vector2D,
  control: Vector2D,
  end: Vector2D,
  t: number
): Vector2D {
  const t1 = 1 - t;
  return {
    x: t1 * t1 * start.x + 2 * t1 * t * control.x + t * t * end.x,
    y: t1 * t1 * start.y + 2 * t1 * t * control.y + t * t * end.y,
  };
}

/**
 * 3차 베지어 곡선 보간
 */
export function cubicBezierLerp(
  start: Vector2D,
  control1: Vector2D,
  control2: Vector2D,
  end: Vector2D,
  t: number
): Vector2D {
  const t1 = 1 - t;
  const t1_3 = t1 * t1 * t1;
  const t1_2_t = 3 * t1 * t1 * t;
  const t1_t_2 = 3 * t1 * t * t;
  const t_3 = t * t * t;

  return {
    x: t1_3 * start.x + t1_2_t * control1.x + t1_t_2 * control2.x + t_3 * end.x,
    y: t1_3 * start.y + t1_2_t * control1.y + t1_t_2 * control2.y + t_3 * end.y,
  };
}
