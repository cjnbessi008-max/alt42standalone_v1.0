/**
 * VectorField Component
 * 여러 벡터를 표시하는 벡터 필드 컴포넌트
 */

import React from 'react';
import type { VectorFieldProps } from '../../types/vector';
import VectorArrow from './VectorArrow';
import '../../styles/animations.css';

export const VectorField: React.FC<VectorFieldProps> = ({
  vectors,
  width,
  height,
  backgroundColor = '#ffffff',
  showGrid = true,
  gridSize = 50,
}) => {
  // 그리드 라인 생성
  const renderGrid = () => {
    if (!showGrid) return null;

    const gridLines = [];
    const majorGridInterval = gridSize * 2;

    // 수직 그리드 라인
    for (let x = 0; x <= width; x += gridSize) {
      const isMajor = x % majorGridInterval === 0;
      gridLines.push(
        <line
          key={`v-${x}`}
          className={isMajor ? 'vector-grid-major' : 'vector-grid'}
          x1={x}
          y1={0}
          x2={x}
          y2={height}
        />
      );
    }

    // 수평 그리드 라인
    for (let y = 0; y <= height; y += gridSize) {
      const isMajor = y % majorGridInterval === 0;
      gridLines.push(
        <line
          key={`h-${y}`}
          className={isMajor ? 'vector-grid-major' : 'vector-grid'}
          x1={0}
          y1={y}
          x2={width}
          y2={y}
        />
      );
    }

    return <g className="grid">{gridLines}</g>;
  };

  return (
    <div className="vector-container">
      <svg
        width={width}
        height={height}
        style={{
          backgroundColor,
          display: 'block',
          maxWidth: '100%',
          height: 'auto',
        }}
        viewBox={`0 0 ${width} ${height}`}
      >
        {/* 그리드 */}
        {renderGrid()}

        {/* 좌표축 */}
        {showGrid && (
          <g className="axes">
            {/* X축 */}
            <line
              x1={0}
              y1={height / 2}
              x2={width}
              y2={height / 2}
              stroke="#666"
              strokeWidth={1.5}
            />
            {/* Y축 */}
            <line
              x1={width / 2}
              y1={0}
              x2={width / 2}
              y2={height}
              stroke="#666"
              strokeWidth={1.5}
            />
          </g>
        )}

        {/* 벡터들 */}
        <g className="vectors">
          {vectors.map((vector, index) => (
            <VectorArrow key={`vector-${index}`} {...vector} />
          ))}
        </g>
      </svg>
    </div>
  );
};

export default VectorField;
