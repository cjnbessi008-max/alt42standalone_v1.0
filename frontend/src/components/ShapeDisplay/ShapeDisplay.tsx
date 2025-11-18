/**
 * 도형 표시 컴포넌트
 * Canvas API를 사용하여 닮음 도형을 렌더링합니다.
 */

import React, { useEffect, useRef } from 'react';
import { Shape } from '../../types';
import './ShapeDisplay.css';

interface ShapeDisplayProps {
  originalShape: Shape;
  scaledShape: Shape;
  scale: number;
  showGrid?: boolean;
}

export const ShapeDisplay: React.FC<ShapeDisplayProps> = ({
  originalShape,
  scaledShape,
  scale,
  showGrid = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 크기 설정
    const width = canvas.width;
    const height = canvas.height;

    // 캔버스 초기화
    ctx.clearRect(0, 0, width, height);

    // 배경
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);

    // 그리드 그리기
    if (showGrid) {
      drawGrid(ctx, width, height);
    }

    // 원본 도형 그리기 (반투명)
    drawShape(ctx, originalShape, 0.3);

    // 확대/축소된 도형 그리기
    drawShape(ctx, scaledShape, 1.0);

    // 배율 표시
    drawScaleLabel(ctx, scale, width, height);
  }, [originalShape, scaledShape, scale, showGrid]);

  /**
   * 그리드 그리기
   */
  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void => {
    const gridSize = 20;

    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;

    // 세로선
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // 가로선
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 중심 축 (진하게)
    ctx.strokeStyle = '#bdbdbd';
    ctx.lineWidth = 1;

    // 중심 세로선
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();

    // 중심 가로선
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  };

  /**
   * 도형 그리기
   */
  const drawShape = (
    ctx: CanvasRenderingContext2D,
    shape: Shape,
    alpha: number
  ): void => {
    if (shape.points.length === 0) return;

    ctx.save();
    ctx.globalAlpha = alpha;

    const color = shape.color || '#3498db';

    if (shape.type === 'circle' && shape.points.length >= 2) {
      // 원 그리기
      const center = shape.points[0];
      const edge = shape.points[1];
      const radius = Math.sqrt(
        Math.pow(edge.x - center.x, 2) + Math.pow(edge.y - center.y, 2)
      );

      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      // 다각형 그리기
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(shape.points[0].x, shape.points[0].y);

      for (let i = 1; i < shape.points.length; i++) {
        ctx.lineTo(shape.points[i].x, shape.points[i].y);
      }

      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  };

  /**
   * 배율 레이블 그리기
   */
  const drawScaleLabel = (
    ctx: CanvasRenderingContext2D,
    scale: number,
    width: number,
    height: number
  ): void => {
    ctx.save();

    // 배경
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, height - 50, 120, 40);

    // 텍스트
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`배율: ${scale.toFixed(2)}x`, 20, height - 30);

    ctx.restore();
  };

  return (
    <div className="shape-display">
      <canvas
        ref={canvasRef}
        width={350}
        height={620}
        className="shape-canvas"
      />
    </div>
  );
};
