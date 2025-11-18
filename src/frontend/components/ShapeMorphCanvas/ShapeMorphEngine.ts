/**
 * Shape Morph Animation Engine
 * Canvas 기반 형상 변환 애니메이션 엔진
 */

import {
  ConceptShape,
  ShapeData,
  TransitionConfig,
} from '@types/shape.types';
import {
  interpolateNumber,
  generatePolygonPoints,
  generateCirclePoints,
  interpolatePoints,
} from '@utils/bezier-interpolation';
import { getEasingFunction } from '@utils/easing-functions';

export interface ShapeMorphEngineOptions {
  canvas: HTMLCanvasElement;
  width?: number;
  height?: number;
  onAnimationComplete?: (shape: ConceptShape) => void;
  onAnimationStart?: (fromShape: ConceptShape, toShape: ConceptShape) => void;
}

export class ShapeMorphEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;

  private currentShape: ConceptShape | null = null;
  private targetShape: ConceptShape | null = null;
  private transitionConfig: TransitionConfig | null = null;

  private startTime: number = 0;
  private isAnimating: boolean = false;

  private onAnimationComplete?: (shape: ConceptShape) => void;
  private onAnimationStart?: (fromShape: ConceptShape, toShape: ConceptShape) => void;

  constructor(options: ShapeMorphEngineOptions) {
    this.canvas = options.canvas;
    const ctx = this.canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }

    this.ctx = ctx;
    this.onAnimationComplete = options.onAnimationComplete;
    this.onAnimationStart = options.onAnimationStart;

    this.setupCanvas(options.width, options.height);
  }

  private setupCanvas(width?: number, height?: number): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    const canvasWidth = width || rect.width;
    const canvasHeight = height || rect.height;

    this.canvas.width = canvasWidth * dpr;
    this.canvas.height = canvasHeight * dpr;
    this.canvas.style.width = `${canvasWidth}px`;
    this.canvas.style.height = `${canvasHeight}px`;

    this.ctx.scale(dpr, dpr);
  }

  /**
   * 형상 변환 시작
   */
  public morphTo(targetShape: ConceptShape, transition: TransitionConfig): void {
    if (this.isAnimating) {
      this.stopAnimation();
    }

    if (!this.currentShape) {
      // 초기 형상 설정
      this.setShape(targetShape);
      return;
    }

    this.targetShape = targetShape;
    this.transitionConfig = transition;
    this.startTime = Date.now();
    this.isAnimating = true;

    if (this.onAnimationStart) {
      this.onAnimationStart(this.currentShape, targetShape);
    }

    console.log('[ShapeMorphEngine] Starting morph animation:',
      this.currentShape.name, '→', targetShape.name);

    this.animate();
  }

  /**
   * 현재 형상 설정 (애니메이션 없이)
   */
  public setShape(shape: ConceptShape): void {
    console.log('[ShapeMorphEngine] Setting shape:', shape.name);
    this.currentShape = shape;
    this.clear();
    this.drawShape(
      shape.shape_data,
      shape.colors.primary,
      shape.colors.secondary || shape.colors.primary
    );
  }

  /**
   * 애니메이션 루프
   */
  private animate = (): void => {
    if (!this.isAnimating || !this.targetShape || !this.transitionConfig || !this.currentShape) {
      return;
    }

    const elapsed = Date.now() - this.startTime;
    const progress = Math.min(elapsed / this.transitionConfig.duration, 1.0);

    // Easing 함수 적용
    const easingFn = getEasingFunction(this.transitionConfig.easing);
    const easedProgress = easingFn(progress);

    // 중간 형상 계산
    const intermediateShape = this.interpolateShapes(
      this.currentShape.shape_data,
      this.targetShape.shape_data,
      easedProgress
    );

    // 색상 보간
    const intermediateColor = this.interpolateColor(
      this.currentShape.colors.primary,
      this.targetShape.colors.primary,
      easedProgress
    );

    const intermediateSecondary = this.interpolateColor(
      this.currentShape.colors.secondary || this.currentShape.colors.primary,
      this.targetShape.colors.secondary || this.targetShape.colors.primary,
      easedProgress
    );

    // 렌더링
    this.clear();
    this.drawShape(intermediateShape, intermediateColor, intermediateSecondary);

    // 애니메이션 완료 확인
    if (progress >= 1.0) {
      this.isAnimating = false;
      this.currentShape = this.targetShape;

      console.log('[ShapeMorphEngine] Animation completed:', this.currentShape.name);

      if (this.onAnimationComplete) {
        this.onAnimationComplete(this.currentShape);
      }
    } else {
      this.animationFrameId = requestAnimationFrame(this.animate);
    }
  };

  /**
   * 두 형상 사이 보간
   */
  private interpolateShapes(from: ShapeData, to: ShapeData, progress: number): ShapeData {
    const result: ShapeData = { ...from };

    // 수치 속성 보간
    if (from.radius !== undefined && to.radius !== undefined) {
      result.radius = interpolateNumber(from.radius, to.radius, progress);
    }

    if (from.rotation !== undefined && to.rotation !== undefined) {
      result.rotation = interpolateNumber(from.rotation, to.rotation, progress);
    }

    if (from.width !== undefined && to.width !== undefined) {
      result.width = interpolateNumber(from.width, to.width, progress);
    }

    if (from.height !== undefined && to.height !== undefined) {
      result.height = interpolateNumber(from.height, to.height, progress);
    }

    if (from.sides !== undefined && to.sides !== undefined) {
      result.sides = Math.round(interpolateNumber(from.sides, to.sides, progress));
    }

    if (from.segments !== undefined && to.segments !== undefined) {
      result.segments = Math.round(interpolateNumber(from.segments, to.segments, progress));
    }

    if (from.filled !== undefined && to.filled !== undefined) {
      result.filled = Math.round(interpolateNumber(from.filled, to.filled, progress));
    }

    // 포인트 배열 보간
    if (from.points && to.points) {
      result.points = interpolatePoints(from.points, to.points, progress);
    }

    return result;
  }

  /**
   * 색상 보간 (HEX)
   */
  private interpolateColor(from: string, to: string, progress: number): string {
    const fromRGB = this.hexToRgb(from);
    const toRGB = this.hexToRgb(to);

    const r = Math.round(interpolateNumber(fromRGB.r, toRGB.r, progress));
    const g = Math.round(interpolateNumber(fromRGB.g, toRGB.g, progress));
    const b = Math.round(interpolateNumber(fromRGB.b, toRGB.b, progress));

    return this.rgbToHex(r, g, b);
  }

  /**
   * 형상 그리기
   */
  private drawShape(shape: ShapeData, primaryColor: string, secondaryColor: string): void {
    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    this.ctx.save();

    switch (shape.type) {
      case 'circle':
        this.drawCircle(centerX, centerY, shape, primaryColor, secondaryColor);
        break;
      case 'polygon':
        this.drawPolygon(centerX, centerY, shape, primaryColor);
        break;
      default:
        this.drawCircle(centerX, centerY, shape, primaryColor, secondaryColor);
    }

    this.ctx.restore();
  }

  private drawCircle(
    cx: number,
    cy: number,
    shape: ShapeData,
    primary: string,
    secondary: string
  ): void {
    const radius = shape.radius || 50;

    // 분수 표현 (segments가 있는 경우)
    if (shape.segments && shape.segments > 1) {
      const anglePerSegment = (Math.PI * 2) / shape.segments;
      const filled = shape.filled || 0;

      for (let i = 0; i < shape.segments; i++) {
        const startAngle = i * anglePerSegment - Math.PI / 2;
        const endAngle = (i + 1) * anglePerSegment - Math.PI / 2;

        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy);
        this.ctx.arc(cx, cy, radius, startAngle, endAngle);
        this.ctx.closePath();

        this.ctx.fillStyle = i < filled ? primary : secondary;
        this.ctx.fill();

        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }
    } else {
      // 일반 원
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = primary;
      this.ctx.fill();
      this.ctx.strokeStyle = '#333';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
  }

  private drawPolygon(cx: number, cy: number, shape: ShapeData, color: string): void {
    const sides = shape.sides || 3;
    const radius = shape.radius || 50;
    const rotation = (shape.rotation || 0) * Math.PI / 180;

    this.ctx.beginPath();

    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI / sides) + rotation - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }

    this.ctx.closePath();
    this.ctx.fillStyle = color;
    this.ctx.fill();
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  /**
   * 캔버스 지우기
   */
  private clear(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);
  }

  /**
   * 애니메이션 정지
   */
  public stopAnimation(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.isAnimating = false;
  }

  /**
   * 현재 형상 가져오기
   */
  public getCurrentShape(): ConceptShape | null {
    return this.currentShape;
  }

  /**
   * 애니메이션 진행 중 여부
   */
  public getIsAnimating(): boolean {
    return this.isAnimating;
  }

  /**
   * HEX to RGB 변환
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  }

  /**
   * RGB to HEX 변환
   */
  private rgbToHex(r: number, g: number, b: number): string {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /**
   * 리소스 정리
   */
  public destroy(): void {
    this.stopAnimation();
    this.clear();
  }

  /**
   * 캔버스 크기 조정
   */
  public resize(width?: number, height?: number): void {
    this.setupCanvas(width, height);

    // 현재 형상 다시 그리기
    if (this.currentShape) {
      this.clear();
      this.drawShape(
        this.currentShape.shape_data,
        this.currentShape.colors.primary,
        this.currentShape.colors.secondary || this.currentShape.colors.primary
      );
    }
  }
}
