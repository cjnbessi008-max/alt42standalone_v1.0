/**
 * Canvas 기반 그래프 렌더링 엔진
 */

import { Point } from '../types/problem';
import { MathEvaluator } from './math-evaluator';

export interface RenderOptions {
  width: number;
  height: number;
  domain: [number, number];
  range: [number, number];
  gridColor: string;
  axisColor: string;
  functionColor: string;
  asymptoteColor: string;
}

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private options: RenderOptions;

  constructor(canvas: HTMLCanvasElement, options: RenderOptions) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context not available');
    }
    this.ctx = ctx;
    this.options = options;

    // 고해상도 지원
    const dpr = window.devicePixelRatio || 1;
    canvas.width = options.width * dpr;
    canvas.height = options.height * dpr;
    canvas.style.width = `${options.width}px`;
    canvas.style.height = `${options.height}px`;
    this.ctx.scale(dpr, dpr);
  }

  /**
   * 좌표 변환: 수학 좌표 -> 캔버스 픽셀
   */
  private toCanvasX(x: number): number {
    const [xMin, xMax] = this.options.domain;
    const ratio = (x - xMin) / (xMax - xMin);
    return ratio * this.options.width;
  }

  private toCanvasY(y: number): number {
    const [yMin, yMax] = this.options.range;
    const ratio = (y - yMin) / (yMax - yMin);
    // Y축은 위아래 반전
    return this.options.height - ratio * this.options.height;
  }

  /**
   * 캔버스 지우기
   */
  clear(): void {
    this.ctx.clearRect(0, 0, this.options.width, this.options.height);
  }

  /**
   * 격자 그리기
   */
  drawGrid(): void {
    const [xMin, xMax] = this.options.domain;
    const [yMin, yMax] = this.options.range;

    this.ctx.strokeStyle = this.options.gridColor;
    this.ctx.lineWidth = 0.5;
    this.ctx.globalAlpha = 0.3;

    // 수직 격자선
    for (let x = Math.ceil(xMin); x <= xMax; x++) {
      if (x === 0) continue; // Y축은 따로 그림
      const canvasX = this.toCanvasX(x);
      this.ctx.beginPath();
      this.ctx.moveTo(canvasX, 0);
      this.ctx.lineTo(canvasX, this.options.height);
      this.ctx.stroke();
    }

    // 수평 격자선
    for (let y = Math.ceil(yMin); y <= yMax; y++) {
      if (y === 0) continue; // X축은 따로 그림
      const canvasY = this.toCanvasY(y);
      this.ctx.beginPath();
      this.ctx.moveTo(0, canvasY);
      this.ctx.lineTo(this.options.width, canvasY);
      this.ctx.stroke();
    }

    this.ctx.globalAlpha = 1;
  }

  /**
   * 좌표축 그리기
   */
  drawAxes(): void {
    this.ctx.strokeStyle = this.options.axisColor;
    this.ctx.lineWidth = 2;

    // X축
    const yZero = this.toCanvasY(0);
    this.ctx.beginPath();
    this.ctx.moveTo(0, yZero);
    this.ctx.lineTo(this.options.width, yZero);
    this.ctx.stroke();

    // Y축
    const xZero = this.toCanvasX(0);
    this.ctx.beginPath();
    this.ctx.moveTo(xZero, 0);
    this.ctx.lineTo(xZero, this.options.height);
    this.ctx.stroke();

    // 눈금 표시
    this.drawAxisLabels();
  }

  /**
   * 축 레이블 그리기
   */
  private drawAxisLabels(): void {
    const [xMin, xMax] = this.options.domain;
    const [yMin, yMax] = this.options.range;

    this.ctx.fillStyle = this.options.axisColor;
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';

    // X축 레이블
    const yZero = this.toCanvasY(0);
    for (let x = Math.ceil(xMin); x <= xMax; x++) {
      if (x === 0) continue;
      const canvasX = this.toCanvasX(x);
      this.ctx.fillText(x.toString(), canvasX, yZero + 15);
    }

    // Y축 레이블
    this.ctx.textAlign = 'right';
    const xZero = this.toCanvasX(0);
    for (let y = Math.ceil(yMin); y <= yMax; y++) {
      if (y === 0) continue;
      const canvasY = this.toCanvasY(y);
      this.ctx.fillText(y.toString(), xZero - 10, canvasY + 4);
    }
  }

  /**
   * 함수 그래프 그리기
   */
  drawFunction(expression: string): void {
    const [xMin, xMax] = this.options.domain;
    const step = (xMax - xMin) / this.options.width;

    this.ctx.strokeStyle = this.options.functionColor;
    this.ctx.lineWidth = 2.5;
    this.ctx.beginPath();

    let isDrawing = false;

    for (let x = xMin; x <= xMax; x += step) {
      const y = MathEvaluator.evaluate(expression, x);

      if (y === null) {
        // 불연속점
        isDrawing = false;
        continue;
      }

      const canvasX = this.toCanvasX(x);
      const canvasY = this.toCanvasY(y);

      // 화면 밖이면 스킵
      if (canvasY < -100 || canvasY > this.options.height + 100) {
        isDrawing = false;
        continue;
      }

      if (!isDrawing) {
        this.ctx.moveTo(canvasX, canvasY);
        isDrawing = true;
      } else {
        this.ctx.lineTo(canvasX, canvasY);
      }
    }

    this.ctx.stroke();
  }

  /**
   * 점근선 그리기 (애니메이션 없음)
   */
  drawAsymptote(type: 'vertical' | 'horizontal', value: number): void {
    this.ctx.strokeStyle = this.options.asymptoteColor;
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([10, 5]); // 점선

    if (type === 'vertical') {
      const canvasX = this.toCanvasX(value);
      this.ctx.beginPath();
      this.ctx.moveTo(canvasX, 0);
      this.ctx.lineTo(canvasX, this.options.height);
      this.ctx.stroke();
    } else {
      const canvasY = this.toCanvasY(value);
      this.ctx.beginPath();
      this.ctx.moveTo(0, canvasY);
      this.ctx.lineTo(this.options.width, canvasY);
      this.ctx.stroke();
    }

    this.ctx.setLineDash([]); // 점선 해제
  }

  /**
   * 점근선 애니메이션 그리기 (선 그리기 효과)
   * @param type 점근선 타입
   * @param value 점근선 위치
   * @param progress 0~1 사이의 진행도
   */
  drawAsymptoteAnimated(
    type: 'vertical' | 'horizontal',
    value: number,
    progress: number
  ): void {
    this.ctx.strokeStyle = this.options.asymptoteColor;
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([10, 5]);
    this.ctx.globalAlpha = Math.min(progress * 2, 1); // 페이드인 효과

    if (type === 'vertical') {
      const canvasX = this.toCanvasX(value);
      const currentHeight = this.options.height * progress;

      this.ctx.beginPath();
      this.ctx.moveTo(canvasX, this.options.height / 2 - currentHeight / 2);
      this.ctx.lineTo(canvasX, this.options.height / 2 + currentHeight / 2);
      this.ctx.stroke();
    } else {
      const canvasY = this.toCanvasY(value);
      const currentWidth = this.options.width * progress;

      this.ctx.beginPath();
      this.ctx.moveTo(this.options.width / 2 - currentWidth / 2, canvasY);
      this.ctx.lineTo(this.options.width / 2 + currentWidth / 2, canvasY);
      this.ctx.stroke();
    }

    this.ctx.setLineDash([]);
    this.ctx.globalAlpha = 1;
  }
}
