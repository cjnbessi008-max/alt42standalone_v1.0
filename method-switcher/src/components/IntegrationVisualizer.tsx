import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { IntegrationResult, IntegrationStep } from '../types/integration';

interface IntegrationVisualizerProps {
  result: IntegrationResult;
  functionFn: (x: number) => number;
  lowerBound: number;
  upperBound: number;
  color: string;
  isAnimating: boolean;
  animationProgress: number; // 0-1
}

/**
 * 적분 시각화 컴포넌트
 * SVG로 함수와 근사 영역을 그림
 */
export const IntegrationVisualizer: React.FC<IntegrationVisualizerProps> = ({
  result,
  functionFn,
  lowerBound,
  upperBound,
  color,
  isAnimating,
  animationProgress
}) => {
  const width = 300;
  const height = 200;
  const padding = 30;

  // 함수 곡선 포인트 생성
  const functionPoints = useMemo(() => {
    const points: { x: number; y: number }[] = [];
    const steps = 100;

    // Y 범위 찾기
    let yMin = Infinity;
    let yMax = -Infinity;
    for (let i = 0; i <= steps; i++) {
      const x = lowerBound + (upperBound - lowerBound) * (i / steps);
      const y = functionFn(x);
      if (y < yMin) yMin = y;
      if (y > yMax) yMax = y;
    }

    const yRange = yMax - yMin;
    const yPadding = yRange * 0.1;

    for (let i = 0; i <= steps; i++) {
      const x = lowerBound + (upperBound - lowerBound) * (i / steps);
      const y = functionFn(x);

      const svgX = padding + ((x - lowerBound) / (upperBound - lowerBound)) * (width - 2 * padding);
      const svgY = height - padding - ((y - yMin + yPadding) / (yRange + 2 * yPadding)) * (height - 2 * padding);

      points.push({ x: svgX, y: svgY });
    }

    return { points, yMin: yMin - yPadding, yMax: yMax + yPadding };
  }, [functionFn, lowerBound, upperBound, width, height, padding]);

  // 애니메이션 진행에 따라 표시할 step 수
  const visibleSteps = Math.floor(result.steps.length * animationProgress);

  // 적분 근사 영역 렌더링
  const renderApproximation = () => {
    const { yMin, yMax } = functionPoints;
    const yRange = yMax - yMin;

    switch (result.method) {
      case 'trapezoidal':
      case 'simpson':
        return result.steps.slice(0, visibleSteps).map((step, idx) => {
          if (idx >= result.steps.length - 1) return null;

          const x1 = step.x;
          const x2 = step.x + (step.width || 0);
          const y1 = step.y;
          const y2 = result.steps[idx + 1]?.y || y1;

          const svgX1 = padding + ((x1 - lowerBound) / (upperBound - lowerBound)) * (width - 2 * padding);
          const svgX2 = padding + ((x2 - lowerBound) / (upperBound - lowerBound)) * (width - 2 * padding);
          const svgY1 = height - padding - ((y1 - yMin) / yRange) * (height - 2 * padding);
          const svgY2 = height - padding - ((y2 - yMin) / yRange) * (height - 2 * padding);
          const svgYBase = height - padding - ((0 - yMin) / yRange) * (height - 2 * padding);

          return (
            <motion.polygon
              key={`trap-${idx}`}
              points={`${svgX1},${svgYBase} ${svgX1},${svgY1} ${svgX2},${svgY2} ${svgX2},${svgYBase}`}
              fill={color}
              fillOpacity={0.3}
              stroke={color}
              strokeWidth={1}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.1 }}
            />
          );
        });

      case 'rectangle':
        return result.steps.slice(0, visibleSteps).map((step, idx) => {
          const x = step.x;
          const y = step.y;
          const w = step.width || 0;

          const svgX = padding + ((x - lowerBound) / (upperBound - lowerBound)) * (width - 2 * padding);
          const svgY = height - padding - ((y - yMin) / yRange) * (height - 2 * padding);
          const svgW = (w / (upperBound - lowerBound)) * (width - 2 * padding);
          const svgYBase = height - padding - ((0 - yMin) / yRange) * (height - 2 * padding);

          return (
            <motion.rect
              key={`rect-${idx}`}
              x={svgX}
              y={Math.min(svgY, svgYBase)}
              width={svgW}
              height={Math.abs(svgY - svgYBase)}
              fill={color}
              fillOpacity={0.3}
              stroke={color}
              strokeWidth={1}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ duration: 0.1 }}
            />
          );
        });

      case 'monte-carlo':
        return result.steps.slice(0, visibleSteps).map((step, idx) => {
          const x = step.x;
          const y = step.y;

          const svgX = padding + ((x - lowerBound) / (upperBound - lowerBound)) * (width - 2 * padding);
          const svgY = height - padding - ((y - yMin) / yRange) * (height - 2 * padding);

          const isInside = step.area > 0;

          return (
            <motion.circle
              key={`mc-${idx}`}
              cx={svgX}
              cy={svgY}
              r={2}
              fill={isInside ? color : '#666'}
              fillOpacity={isInside ? 0.6 : 0.3}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.05 }}
            />
          );
        });

      default:
        return null;
    }
  };

  return (
    <svg width={width} height={height} style={{ backgroundColor: '#f9fafb' }}>
      {/* 좌표축 */}
      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        stroke="#ccc"
        strokeWidth={2}
      />
      <line
        x1={padding}
        y1={padding}
        x2={padding}
        y2={height - padding}
        stroke="#ccc"
        strokeWidth={2}
      />

      {/* 적분 근사 영역 */}
      <g>{renderApproximation()}</g>

      {/* 함수 곡선 */}
      <motion.path
        d={`M ${functionPoints.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ')}`}
        stroke={color}
        strokeWidth={2}
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1 }}
      />

      {/* 적분 구간 표시 */}
      <text x={padding} y={height - 10} fontSize={10} fill="#666">
        {lowerBound.toFixed(1)}
      </text>
      <text x={width - padding - 20} y={height - 10} fontSize={10} fill="#666">
        {upperBound.toFixed(1)}
      </text>
    </svg>
  );
};
