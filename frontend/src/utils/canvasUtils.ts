/**
 * Canvas Utilities for Drawing Functions and Graphs
 */

import type { Point, CanvasConfig } from '../types';

export class CanvasUtils {
  /**
   * Transform a mathematical point to canvas coordinates
   */
  static mathToCanvas(
    point: Point,
    config: CanvasConfig,
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number
  ): Point {
    const { width, height, padding } = config;
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;

    const canvasX = padding + ((point.x - xMin) / xRange) * (width - 2 * padding);
    const canvasY = height - padding - ((point.y - yMin) / yRange) * (height - 2 * padding);

    return { x: canvasX, y: canvasY };
  }

  /**
   * Transform canvas coordinates to mathematical point
   */
  static canvasToMath(
    point: Point,
    config: CanvasConfig,
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number
  ): Point {
    const { width, height, padding } = config;
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;

    const mathX = xMin + ((point.x - padding) / (width - 2 * padding)) * xRange;
    const mathY = yMin + ((height - padding - point.y) / (height - 2 * padding)) * yRange;

    return { x: mathX, y: mathY };
  }

  /**
   * Draw coordinate axes
   */
  static drawAxes(
    ctx: CanvasRenderingContext2D,
    config: CanvasConfig,
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number
  ): void {
    const { width, height, padding } = config;

    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    // X-axis
    if (yMin <= 0 && yMax >= 0) {
      const yZero = this.mathToCanvas({ x: 0, y: 0 }, config, xMin, xMax, yMin, yMax);
      ctx.moveTo(padding, yZero.y);
      ctx.lineTo(width - padding, yZero.y);
    }

    // Y-axis
    if (xMin <= 0 && xMax >= 0) {
      const xZero = this.mathToCanvas({ x: 0, y: 0 }, config, xMin, xMax, yMin, yMax);
      ctx.moveTo(xZero.x, padding);
      ctx.lineTo(xZero.x, height - padding);
    }

    ctx.stroke();
  }

  /**
   * Draw grid lines
   */
  static drawGrid(
    ctx: CanvasRenderingContext2D,
    config: CanvasConfig,
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    gridSpacing: number = 1
  ): void {
    const { width, height, padding } = config;

    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 2]);

    // Vertical grid lines
    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x += gridSpacing) {
      const point = this.mathToCanvas({ x, y: 0 }, config, xMin, xMax, yMin, yMax);
      ctx.beginPath();
      ctx.moveTo(point.x, padding);
      ctx.lineTo(point.x, height - padding);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y += gridSpacing) {
      const point = this.mathToCanvas({ x: 0, y }, config, xMin, xMax, yMin, yMax);
      ctx.beginPath();
      ctx.moveTo(padding, point.y);
      ctx.lineTo(width - padding, point.y);
      ctx.stroke();
    }

    ctx.setLineDash([]);
  }

  /**
   * Draw a function curve
   */
  static drawCurve(
    ctx: CanvasRenderingContext2D,
    points: Point[],
    config: CanvasConfig,
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    color: string,
    lineWidth: number = 2
  ): void {
    if (points.length === 0) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();

    let started = false;

    for (const point of points) {
      const canvasPoint = this.mathToCanvas(point, config, xMin, xMax, yMin, yMax);

      // Skip points outside visible range
      if (
        canvasPoint.x < 0 || canvasPoint.x > config.width ||
        canvasPoint.y < 0 || canvasPoint.y > config.height
      ) {
        started = false;
        continue;
      }

      if (!started) {
        ctx.moveTo(canvasPoint.x, canvasPoint.y);
        started = true;
      } else {
        ctx.lineTo(canvasPoint.x, canvasPoint.y);
      }
    }

    ctx.stroke();
  }

  /**
   * Fill area under curve
   */
  static fillUnderCurve(
    ctx: CanvasRenderingContext2D,
    points: Point[],
    config: CanvasConfig,
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    color: string,
    alpha: number = 0.3
  ): void {
    if (points.length === 0) return;

    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();

    // Start from the first point
    const firstPoint = this.mathToCanvas(points[0], config, xMin, xMax, yMin, yMax);
    const baseline = this.mathToCanvas({ x: points[0].x, y: 0 }, config, xMin, xMax, yMin, yMax);

    ctx.moveTo(firstPoint.x, baseline.y);
    ctx.lineTo(firstPoint.x, firstPoint.y);

    // Draw the curve
    for (const point of points) {
      const canvasPoint = this.mathToCanvas(point, config, xMin, xMax, yMin, yMax);
      ctx.lineTo(canvasPoint.x, canvasPoint.y);
    }

    // Close the path to the baseline
    const lastPoint = this.mathToCanvas(
      points[points.length - 1],
      config,
      xMin,
      xMax,
      yMin,
      yMax
    );
    const lastBaseline = this.mathToCanvas(
      { x: points[points.length - 1].x, y: 0 },
      config,
      xMin,
      xMax,
      yMin,
      yMax
    );

    ctx.lineTo(lastPoint.x, lastBaseline.y);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  /**
   * Clear the canvas
   */
  static clear(ctx: CanvasRenderingContext2D, config: CanvasConfig): void {
    ctx.clearRect(0, 0, config.width, config.height);
  }

  /**
   * Draw text label
   */
  static drawLabel(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    color: string = '#333',
    fontSize: number = 12
  ): void {
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }
}
