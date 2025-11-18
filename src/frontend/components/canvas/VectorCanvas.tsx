/**
 * VectorCanvas Component
 * Main canvas for displaying and interacting with vectors
 */

import React from 'react';
import { VectorComponent, VectorGraphState } from '../../types/vector.types';
import { DraggableVector } from '../interactions/DraggableVector';
import { Vector2D } from '../../types/vector.types';

interface VectorCanvasProps {
  width: number;
  height: number;
  graphState: VectorGraphState;
  vectors: VectorComponent[];
  onVectorChange: (id: string, newValue: Vector2D) => void;
  onVectorSelect?: (id: string) => void;
  showResultant?: boolean;
  resultantColor?: string;
}

export const VectorCanvas: React.FC<VectorCanvasProps> = ({
  width,
  height,
  graphState,
  vectors,
  onVectorChange,
  onVectorSelect,
  showResultant = true,
  resultantColor = '#ff00ff',
}) => {
  const { origin, scale, gridSize, showGrid, showAxes, axisRange } = graphState;

  /**
   * Render grid lines
   */
  const renderGrid = () => {
    if (!showGrid) return null;

    const lines: JSX.Element[] = [];
    const { xMin, xMax, yMin, yMax } = axisRange;

    // Vertical grid lines
    for (let x = xMin; x <= xMax; x += gridSize) {
      const screenX = origin.x + x * scale;
      lines.push(
        <line
          key={`grid-v-${x}`}
          x1={screenX}
          y1={0}
          x2={screenX}
          y2={height}
          stroke="#e0e0e0"
          strokeWidth={x === 0 ? 1.5 : 0.5}
          opacity={x === 0 ? 0.5 : 0.3}
        />
      );
    }

    // Horizontal grid lines
    for (let y = yMin; y <= yMax; y += gridSize) {
      const screenY = origin.y - y * scale;
      lines.push(
        <line
          key={`grid-h-${y}`}
          x1={0}
          y1={screenY}
          x2={width}
          y2={screenY}
          stroke="#e0e0e0"
          strokeWidth={y === 0 ? 1.5 : 0.5}
          opacity={y === 0 ? 0.5 : 0.3}
        />
      );
    }

    return <g className="grid">{lines}</g>;
  };

  /**
   * Render coordinate axes
   */
  const renderAxes = () => {
    if (!showAxes) return null;

    const { xMin, xMax, yMin, yMax } = axisRange;

    return (
      <g className="axes">
        {/* X-axis */}
        <line
          x1={origin.x + xMin * scale}
          y1={origin.y}
          x2={origin.x + xMax * scale}
          y2={origin.y}
          stroke="#333"
          strokeWidth={2}
        />
        {/* X-axis arrow */}
        <polygon
          points={`${origin.x + xMax * scale},${origin.y} ${
            origin.x + xMax * scale - 10
          },${origin.y - 5} ${origin.x + xMax * scale - 10},${origin.y + 5}`}
          fill="#333"
        />
        {/* X-axis label */}
        <text
          x={origin.x + xMax * scale - 20}
          y={origin.y + 20}
          fill="#333"
          fontSize="14"
          fontWeight="bold"
        >
          x
        </text>

        {/* Y-axis */}
        <line
          x1={origin.x}
          y1={origin.y - yMin * scale}
          x2={origin.x}
          y2={origin.y - yMax * scale}
          stroke="#333"
          strokeWidth={2}
        />
        {/* Y-axis arrow */}
        <polygon
          points={`${origin.x},${origin.y - yMax * scale} ${origin.x - 5},${
            origin.y - yMax * scale + 10
          } ${origin.x + 5},${origin.y - yMax * scale + 10}`}
          fill="#333"
        />
        {/* Y-axis label */}
        <text
          x={origin.x + 15}
          y={origin.y - yMax * scale + 20}
          fill="#333"
          fontSize="14"
          fontWeight="bold"
        >
          y
        </text>

        {/* Axis tick marks and labels */}
        {renderAxisTicks()}
      </g>
    );
  };

  /**
   * Render axis tick marks and labels
   */
  const renderAxisTicks = () => {
    const ticks: JSX.Element[] = [];
    const { xMin, xMax, yMin, yMax } = axisRange;
    const tickSize = 5;

    // X-axis ticks
    for (let x = xMin; x <= xMax; x += gridSize) {
      if (x === 0) continue;
      const screenX = origin.x + x * scale;
      ticks.push(
        <g key={`tick-x-${x}`}>
          <line
            x1={screenX}
            y1={origin.y - tickSize}
            x2={screenX}
            y2={origin.y + tickSize}
            stroke="#333"
            strokeWidth={1}
          />
          <text
            x={screenX}
            y={origin.y + 20}
            fill="#666"
            fontSize="10"
            textAnchor="middle"
          >
            {x}
          </text>
        </g>
      );
    }

    // Y-axis ticks
    for (let y = yMin; y <= yMax; y += gridSize) {
      if (y === 0) continue;
      const screenY = origin.y - y * scale;
      ticks.push(
        <g key={`tick-y-${y}`}>
          <line
            x1={origin.x - tickSize}
            y1={screenY}
            x2={origin.x + tickSize}
            y2={screenY}
            stroke="#333"
            strokeWidth={1}
          />
          <text
            x={origin.x - 15}
            y={screenY + 4}
            fill="#666"
            fontSize="10"
            textAnchor="end"
          >
            {y}
          </text>
        </g>
      );
    }

    return ticks;
  };

  /**
   * Calculate and render resultant vector
   */
  const renderResultant = () => {
    if (!showResultant || vectors.length === 0) return null;

    // Calculate sum of all vectors
    const resultant = vectors.reduce(
      (sum, v) => ({ x: sum.x + v.value.x, y: sum.y + v.value.y }),
      { x: 0, y: 0 }
    );

    const endX = origin.x + resultant.x * scale;
    const endY = origin.y - resultant.y * scale;

    // Arrow head
    const arrowSize = 15;
    const angle = Math.atan2(-(resultant.y * scale), resultant.x * scale);
    const arrowPoints = [
      { x: endX, y: endY },
      {
        x: endX - arrowSize * Math.cos(angle - Math.PI / 6),
        y: endY + arrowSize * Math.sin(angle - Math.PI / 6),
      },
      {
        x: endX - arrowSize * Math.cos(angle + Math.PI / 6),
        y: endY + arrowSize * Math.sin(angle + Math.PI / 6),
      },
    ];

    const arrowPath = `M ${arrowPoints[0].x} ${arrowPoints[0].y} L ${arrowPoints[1].x} ${arrowPoints[1].y} L ${arrowPoints[2].x} ${arrowPoints[2].y} Z`;

    return (
      <g className="resultant-vector">
        <line
          x1={origin.x}
          y1={origin.y}
          x2={endX}
          y2={endY}
          stroke={resultantColor}
          strokeWidth={3}
          strokeDasharray="5,5"
          opacity={0.7}
        />
        <path d={arrowPath} fill={resultantColor} opacity={0.7} />
        <text
          x={endX + 15}
          y={endY}
          fill={resultantColor}
          fontSize="14"
          fontWeight="bold"
        >
          R ({resultant.x.toFixed(1)}, {resultant.y.toFixed(1)})
        </text>
      </g>
    );
  };

  return (
    <svg
      width={width}
      height={height}
      style={{
        border: '2px solid #ccc',
        borderRadius: '8px',
        backgroundColor: '#fafafa',
        touchAction: 'none', // Prevent default touch behavior
      }}
    >
      {renderGrid()}
      {renderAxes()}

      {/* Render all vectors */}
      {vectors.map((vector) => (
        <DraggableVector
          key={vector.id}
          vector={vector}
          origin={origin}
          scale={scale}
          onVectorChange={onVectorChange}
          onSelect={onVectorSelect}
          constraints={{
            minX: axisRange.xMin * scale + origin.x,
            maxX: axisRange.xMax * scale + origin.x,
            minY: origin.y - axisRange.yMax * scale,
            maxY: origin.y - axisRange.yMin * scale,
          }}
        />
      ))}

      {renderResultant()}
    </svg>
  );
};
