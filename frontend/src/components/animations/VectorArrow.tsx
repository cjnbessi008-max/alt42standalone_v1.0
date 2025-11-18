/**
 * VectorArrow Component
 * SVG 기반의 부드러운 화살표 애니메이션 컴포넌트
 */

import React, { useMemo } from 'react';
import type { VectorArrowProps } from '../../types/vector';
import { useVectorAnimation } from '../../hooks/useVectorAnimation';
import { subtract, magnitude, angle } from '../../utils/vectorMath';
import '../../styles/animations.css';

export const VectorArrow: React.FC<VectorArrowProps> = ({
  start,
  end,
  color = '#2563eb',
  strokeWidth = 2,
  duration = 1000,
  delay = 0,
  animated = true,
  arrowHeadSize = 10,
  label,
  onAnimationComplete,
}) => {
  // 애니메이션 훅 사용
  const { animationState } = useVectorAnimation({
    start,
    end,
    duration,
    delay,
    autoPlay: animated,
    onComplete: onAnimationComplete,
  });

  // 현재 표시할 끝점 (애니메이션 적용)
  const currentEnd = animated ? animationState.currentPosition : end;

  // 화살표 방향 벡터와 각도 계산
  const vectorData = useMemo(() => {
    const direction = subtract(currentEnd, start);
    const length = magnitude(direction);
    const rotation = angle(direction);

    return { direction, length, rotation };
  }, [start, currentEnd]);

  // 화살표 머리 경로 계산
  const arrowHeadPath = useMemo(() => {
    const headLength = arrowHeadSize;
    const headWidth = arrowHeadSize * 0.6;

    // 화살표 머리의 세 꼭짓점
    const tip = { x: currentEnd.x, y: currentEnd.y };
    const left = {
      x: currentEnd.x - headLength * Math.cos(vectorData.rotation - Math.PI / 6),
      y: currentEnd.y - headLength * Math.sin(vectorData.rotation - Math.PI / 6),
    };
    const right = {
      x: currentEnd.x - headLength * Math.cos(vectorData.rotation + Math.PI / 6),
      y: currentEnd.y - headLength * Math.sin(vectorData.rotation + Math.PI / 6),
    };

    return `M ${tip.x} ${tip.y} L ${left.x} ${left.y} L ${right.x} ${right.y} Z`;
  }, [currentEnd, vectorData.rotation, arrowHeadSize]);

  // 라벨 위치 계산 (화살표 중간)
  const labelPosition = useMemo(() => {
    return {
      x: (start.x + currentEnd.x) / 2,
      y: (start.y + currentEnd.y) / 2 - 10, // 화살표 위쪽에 표시
    };
  }, [start, currentEnd]);

  // 애니메이션 클래스
  const animationClass = animated ? 'vector-arrow-animated fade-in' : '';

  return (
    <g className={`vector-arrow ${animationClass}`} style={{ color }}>
      {/* 화살표 선 */}
      <line
        className="arrow-line"
        x1={start.x}
        y1={start.y}
        x2={currentEnd.x}
        y2={currentEnd.y}
        strokeWidth={strokeWidth}
        style={{
          animationDelay: `${delay}ms`,
          animationDuration: `${duration}ms`,
        }}
      />

      {/* 화살표 머리 */}
      <path
        className="arrow-head"
        d={arrowHeadPath}
        style={{
          animationDelay: `${delay}ms`,
          animationDuration: `${duration}ms`,
        }}
      />

      {/* 라벨 (있는 경우) */}
      {label && (
        <text
          className="vector-label"
          x={labelPosition.x}
          y={labelPosition.y}
          style={{
            animationDelay: `${delay}ms`,
            animationDuration: `${duration}ms`,
          }}
        >
          {label}
        </text>
      )}
    </g>
  );
};

export default VectorArrow;
