/**
 * Bezier Interpolation Utilities
 *
 * 두 형상 사이의 부드러운 보간을 위한 유틸리티 함수들
 */

import { Point } from '@types/shape.types';

/**
 * 두 숫자 사이 선형 보간
 */
export function interpolateNumber(
  from: number,
  to: number,
  progress: number
): number {
  return from + (to - from) * progress;
}

/**
 * 두 포인트 사이 보간
 */
export function interpolatePoint(
  from: Point,
  to: Point,
  progress: number
): Point {
  return {
    x: interpolateNumber(from.x, to.x, progress),
    y: interpolateNumber(from.y, to.y, progress),
  };
}

/**
 * 포인트 배열 사이 보간
 *
 * 두 배열의 길이가 다른 경우 처리:
 * - 짧은 배열을 긴 배열 길이에 맞춰 보간
 */
export function interpolatePoints(
  from: Point[],
  to: Point[],
  progress: number
): Point[] {
  const fromLen = from.length;
  const toLen = to.length;

  // 길이가 같은 경우 - 간단한 보간
  if (fromLen === toLen) {
    return from.map((point, i) => interpolatePoint(point, to[i], progress));
  }

  // 길이가 다른 경우 - 포인트 재샘플링
  const targetLen = Math.max(fromLen, toLen);
  const fromResampled = resamplePoints(from, targetLen);
  const toResampled = resamplePoints(to, targetLen);

  return fromResampled.map((point, i) =>
    interpolatePoint(point, toResampled[i], progress)
  );
}

/**
 * 포인트 배열을 지정된 개수로 재샘플링
 */
export function resamplePoints(points: Point[], targetCount: number): Point[] {
  if (points.length === targetCount) {
    return [...points];
  }

  const result: Point[] = [];
  const totalLength = calculatePathLength(points);
  const segmentLength = totalLength / (targetCount - 1);

  result.push({ ...points[0] });

  let currentLength = 0;
  let targetLength = segmentLength;
  let currentIndex = 0;

  while (result.length < targetCount - 1 && currentIndex < points.length - 1) {
    const p1 = points[currentIndex];
    const p2 = points[currentIndex + 1];
    const segLen = distance(p1, p2);

    if (currentLength + segLen >= targetLength) {
      const t = (targetLength - currentLength) / segLen;
      result.push(interpolatePoint(p1, p2, t));
      targetLength += segmentLength;
    } else {
      currentLength += segLen;
      currentIndex++;
    }
  }

  result.push({ ...points[points.length - 1] });

  return result;
}

/**
 * 경로의 전체 길이 계산
 */
export function calculatePathLength(points: Point[]): number {
  let length = 0;
  for (let i = 0; i < points.length - 1; i++) {
    length += distance(points[i], points[i + 1]);
  }
  return length;
}

/**
 * 두 포인트 사이의 거리
 */
export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 정다각형의 포인트 배열 생성
 */
export function generatePolygonPoints(
  centerX: number,
  centerY: number,
  radius: number,
  sides: number,
  rotation: number = 0
): Point[] {
  const points: Point[] = [];
  const angleStep = (Math.PI * 2) / sides;
  const rotationRad = (rotation * Math.PI) / 180;

  for (let i = 0; i < sides; i++) {
    const angle = i * angleStep + rotationRad - Math.PI / 2;
    points.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  }

  return points;
}

/**
 * 원의 포인트 배열 생성 (근사)
 */
export function generateCirclePoints(
  centerX: number,
  centerY: number,
  radius: number,
  segments: number = 60
): Point[] {
  const points: Point[] = [];
  const angleStep = (Math.PI * 2) / segments;

  for (let i = 0; i < segments; i++) {
    const angle = i * angleStep;
    points.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  }

  return points;
}

/**
 * 베지어 곡선 포인트 생성
 */
export function generateBezierPoints(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  segments: number = 20
): Point[] {
  const points: Point[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    points.push(cubicBezier(p0, p1, p2, p3, t));
  }

  return points;
}

/**
 * 큐빅 베지어 곡선 계산
 */
export function cubicBezier(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number
): Point {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
  };
}

/**
 * 포인트 배열을 스무딩 (Catmull-Rom spline)
 */
export function smoothPoints(points: Point[], tension: number = 0.5): Point[] {
  if (points.length < 3) return [...points];

  const result: Point[] = [];
  result.push({ ...points[0] });

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    // Catmull-Rom 곡선으로 세그먼트 생성
    for (let t = 0; t <= 1; t += 0.1) {
      result.push(catmullRom(p0, p1, p2, p3, t, tension));
    }
  }

  result.push({ ...points[points.length - 1] });

  return result;
}

/**
 * Catmull-Rom spline 계산
 */
export function catmullRom(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number,
  tension: number = 0.5
): Point {
  const t2 = t * t;
  const t3 = t2 * t;

  const v0x = (p2.x - p0.x) * tension;
  const v0y = (p2.y - p0.y) * tension;
  const v1x = (p3.x - p1.x) * tension;
  const v1y = (p3.y - p1.y) * tension;

  return {
    x:
      (2 * p1.x - 2 * p2.x + v0x + v1x) * t3 +
      (-3 * p1.x + 3 * p2.x - 2 * v0x - v1x) * t2 +
      v0x * t +
      p1.x,
    y:
      (2 * p1.y - 2 * p2.y + v0y + v1y) * t3 +
      (-3 * p1.y + 3 * p2.y - 2 * v0y - v1y) * t2 +
      v0y * t +
      p1.y,
  };
}
