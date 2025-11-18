/**
 * Scale Calculator Service
 * 닮음 배율 계산 및 도형 변환을 담당합니다.
 */

import { Point, Shape } from '../types';

export class ScaleCalculator {
  /**
   * 도형을 배율에 따라 확대/축소
   * @param shape 원본 도형
   * @param scale 배율
   * @param center 중심점 (기본값: 도형의 중심)
   * @returns 변환된 도형
   */
  public static scaleShape(
    shape: Shape,
    scale: number,
    center?: Point
  ): Shape {
    // 중심점이 없으면 도형의 중심 계산
    const shapeCenter = center || this.getShapeCenter(shape);

    // 각 점을 중심점 기준으로 확대/축소
    const scaledPoints = shape.points.map(point => ({
      x: shapeCenter.x + (point.x - shapeCenter.x) * scale,
      y: shapeCenter.y + (point.y - shapeCenter.y) * scale
    }));

    return {
      ...shape,
      points: scaledPoints
    };
  }

  /**
   * 도형의 중심점 계산
   * @param shape 도형
   * @returns 중심점
   */
  public static getShapeCenter(shape: Shape): Point {
    if (shape.points.length === 0) {
      return { x: 0, y: 0 };
    }

    const sum = shape.points.reduce(
      (acc, point) => ({
        x: acc.x + point.x,
        y: acc.y + point.y
      }),
      { x: 0, y: 0 }
    );

    return {
      x: sum.x / shape.points.length,
      y: sum.y / shape.points.length
    };
  }

  /**
   * 두 도형 간의 닮음 배율 계산
   * @param original 원본 도형
   * @param scaled 확대/축소된 도형
   * @returns 닮음 배율
   */
  public static calculateScale(original: Shape, scaled: Shape): number {
    if (original.points.length === 0 || scaled.points.length === 0) {
      return 1;
    }

    // 첫 번째 변의 길이 비율로 배율 계산
    if (original.points.length >= 2 && scaled.points.length >= 2) {
      const originalLength = this.getDistance(
        original.points[0],
        original.points[1]
      );
      const scaledLength = this.getDistance(
        scaled.points[0],
        scaled.points[1]
      );

      if (originalLength === 0) return 1;
      return scaledLength / originalLength;
    }

    return 1;
  }

  /**
   * 두 점 사이의 거리 계산
   * @param p1 첫 번째 점
   * @param p2 두 번째 점
   * @returns 거리
   */
  public static getDistance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 도형의 면적 계산
   * @param shape 도형
   * @returns 면적
   */
  public static getArea(shape: Shape): number {
    const points = shape.points;

    if (shape.type === 'circle' && points.length >= 2) {
      // 원의 면적: π * r^2
      const radius = this.getDistance(points[0], points[1]);
      return Math.PI * radius * radius;
    }

    if (points.length < 3) {
      return 0;
    }

    // Shoelace formula (다각형 면적 계산)
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }

    return Math.abs(area / 2);
  }

  /**
   * 배율에 따른 면적 비율 계산
   * @param scale 닮음 배율
   * @returns 면적 비율 (배율의 제곱)
   */
  public static getAreaRatio(scale: number): number {
    return scale * scale;
  }

  /**
   * 직사각형 생성
   * @param x 좌측 상단 X 좌표
   * @param y 좌측 상단 Y 좌표
   * @param width 너비
   * @param height 높이
   * @param color 색상
   * @returns 직사각형 도형
   */
  public static createRectangle(
    x: number,
    y: number,
    width: number,
    height: number,
    color: string = '#3498db'
  ): Shape {
    return {
      type: 'rectangle',
      points: [
        { x, y },
        { x: x + width, y },
        { x: x + width, y: y + height },
        { x, y: y + height }
      ],
      color
    };
  }

  /**
   * 삼각형 생성
   * @param x 중심 X 좌표
   * @param y 중심 Y 좌표
   * @param size 크기
   * @param color 색상
   * @returns 삼각형 도형
   */
  public static createTriangle(
    x: number,
    y: number,
    size: number,
    color: string = '#e74c3c'
  ): Shape {
    const height = size * Math.sqrt(3) / 2;
    return {
      type: 'triangle',
      points: [
        { x, y: y - height * 2/3 },               // 상단
        { x: x - size/2, y: y + height * 1/3 },  // 좌하단
        { x: x + size/2, y: y + height * 1/3 }   // 우하단
      ],
      color
    };
  }

  /**
   * 배율이 유효한지 검증
   * @param scale 배율
   * @param minScale 최소 배율
   * @param maxScale 최대 배율
   * @returns 유효 여부
   */
  public static isValidScale(
    scale: number,
    minScale: number = 0.5,
    maxScale: number = 3.0
  ): boolean {
    return scale >= minScale && scale <= maxScale && !isNaN(scale);
  }

  /**
   * 배율을 범위 내로 제한
   * @param scale 배율
   * @param minScale 최소 배율
   * @param maxScale 최대 배율
   * @returns 제한된 배율
   */
  public static clampScale(
    scale: number,
    minScale: number = 0.5,
    maxScale: number = 3.0
  ): number {
    return Math.max(minScale, Math.min(maxScale, scale));
  }
}
