import React, { useEffect, useRef } from 'react';
import { Inequality } from '../types';
import { satisfiesInequality } from '../utils/inequalityParser';

interface LightIntervalProps {
  inequality: Inequality;
  minValue: number;
  maxValue: number;
  resolution: number;
  lightColor: string;
  backgroundColor: string;
}

/**
 * 부등식의 실수 해를 빛의 세기로 시각화하는 컴포넌트
 */
export const LightInterval: React.FC<LightIntervalProps> = ({
  inequality,
  minValue,
  maxValue,
  resolution,
  lightColor,
  backgroundColor,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 배경 초기화
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // x축 범위
    const range = maxValue - minValue;
    const step = range / resolution;

    // 각 픽셀에 대해 부등식 만족 여부 확인 및 시각화
    for (let i = 0; i < resolution; i++) {
      const x = minValue + i * step;
      const satisfies = satisfiesInequality(x, inequality);

      if (satisfies) {
        // 만족하는 구간은 빛으로 표시
        const pixelX = (i / resolution) * width;
        const pixelWidth = Math.ceil((1 / resolution) * width) + 1;

        // 그라데이션 효과 (경계 부근에서 부드러운 전환)
        const gradient = ctx.createLinearGradient(
          pixelX,
          0,
          pixelX + pixelWidth,
          0
        );

        // 경계 감지
        const isNearLeftBound =
          inequality.leftBound !== undefined &&
          Math.abs(x - inequality.leftBound) < step * 2;

        const isNearRightBound =
          inequality.rightBound !== undefined &&
          Math.abs(x - inequality.rightBound) < step * 2;

        let intensity = 1.0;

        if (isNearLeftBound || isNearRightBound) {
          // 경계 부근에서는 강도를 조절하여 그라데이션 효과
          const distanceToLeftBound = inequality.leftBound
            ? Math.abs(x - inequality.leftBound)
            : Infinity;
          const distanceToRightBound = inequality.rightBound
            ? Math.abs(x - inequality.rightBound)
            : Infinity;

          const minDistance = Math.min(distanceToLeftBound, distanceToRightBound);
          intensity = Math.min(1.0, minDistance / (step * 2));

          // includeLeft/Right가 false인 경우 경계에서 빛이 없음
          if (
            (isNearLeftBound && !inequality.includeLeft && distanceToLeftBound < step * 0.5) ||
            (isNearRightBound && !inequality.includeRight && distanceToRightBound < step * 0.5)
          ) {
            intensity = 0;
          }
        }

        // 빛의 색상 및 강도 적용
        const color = hexToRgb(lightColor);
        if (color) {
          gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity})`);
          gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, ${intensity})`);

          ctx.fillStyle = gradient;
          ctx.fillRect(pixelX, 0, pixelWidth, height);

          // 빛의 글로우 효과
          ctx.shadowBlur = 20 * intensity;
          ctx.shadowColor = lightColor;
          ctx.fillRect(pixelX, height / 3, pixelWidth, height / 3);
          ctx.shadowBlur = 0;
        }
      }
    }

    // 수직선 (수직선 표시)
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // 경계점 표시
    if (inequality.leftBound !== undefined) {
      const x = ((inequality.leftBound - minValue) / range) * width;
      drawBoundaryPoint(ctx, x, height / 2, inequality.includeLeft || false, lightColor);
    }

    if (inequality.rightBound !== undefined) {
      const x = ((inequality.rightBound - minValue) / range) * width;
      drawBoundaryPoint(ctx, x, height / 2, inequality.includeRight || false, lightColor);
    }
  }, [inequality, minValue, maxValue, resolution, lightColor, backgroundColor]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-900">
      <canvas
        ref={canvasRef}
        width={800}
        height={200}
        className="w-full h-full"
        style={{ imageRendering: 'crisp-edges' }}
      />
    </div>
  );
};

// 헬퍼 함수들
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function drawBoundaryPoint(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  included: boolean,
  color: string
) {
  ctx.fillStyle = included ? color : '#fff';
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(x, y, 6, 0, 2 * Math.PI);

  if (included) {
    ctx.fill();
  } else {
    ctx.stroke();
  }
}
