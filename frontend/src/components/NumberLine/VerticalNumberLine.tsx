import React, { useState } from 'react';
import type { VerticalNumberLineProps, NumberRange } from './types';
import { RangeGlow } from './RangeGlow';
import './VerticalNumberLine.css';

export const VerticalNumberLine: React.FC<VerticalNumberLineProps> = ({
  min = -10,
  max = 10,
  selectedRange,
  onRangeSelect,
  showGlow = true,
  glowIntensity = 1,
  tickInterval = 1,
  height = 500,
  width = 200,
}) => {
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [currentDrag, setCurrentDrag] = useState<number | null>(null);

  const totalRange = max - min;
  const centerX = width / 2;

  // Generate tick marks
  const ticks = [];
  for (let i = min; i <= max; i += tickInterval) {
    ticks.push(i);
  }

  // Convert number value to Y position on SVG
  const valueToY = (value: number): number => {
    const percent = ((value - min) / totalRange) * 100;
    return (height * (100 - percent)) / 100;
  };

  // Convert Y position to number value
  const yToValue = (y: number): number => {
    const percent = ((height - y) / height) * 100;
    const value = min + (totalRange * percent) / 100;
    return Math.round(value / tickInterval) * tickInterval;
  };

  // Handle mouse down to start range selection
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const svgRect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - svgRect.top;
    const value = yToValue(y);
    setDragStart(value);
    setCurrentDrag(value);
  };

  // Handle mouse move during drag
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (dragStart !== null) {
      const svgRect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - svgRect.top;
      const value = yToValue(y);
      setCurrentDrag(value);
    }
  };

  // Handle mouse up to complete range selection
  const handleMouseUp = () => {
    if (dragStart !== null && currentDrag !== null && onRangeSelect) {
      const range: NumberRange = {
        start: Math.min(dragStart, currentDrag),
        end: Math.max(dragStart, currentDrag),
      };
      onRangeSelect(range);
    }
    setDragStart(null);
    setCurrentDrag(null);
  };

  // Calculate current dragging range
  const getDraggingRange = (): NumberRange | null => {
    if (dragStart !== null && currentDrag !== null) {
      return {
        start: Math.min(dragStart, currentDrag),
        end: Math.max(dragStart, currentDrag),
      };
    }
    return null;
  };

  const draggingRange = getDraggingRange();

  return (
    <svg
      width={width}
      height={height}
      className="vertical-number-line"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Background */}
      <rect width={width} height={height} fill="#f5f5f5" rx={10} />

      {/* Main vertical line */}
      <line
        x1={centerX}
        y1={0}
        x2={centerX}
        y2={height}
        stroke="#333"
        strokeWidth={3}
        className="main-line"
      />

      {/* Render selected range glow */}
      {showGlow && selectedRange && (
        <RangeGlow
          range={selectedRange}
          min={min}
          max={max}
          height={height}
          intensity={glowIntensity}
          color="#4CAF50"
          animated={true}
        />
      )}

      {/* Render dragging range preview */}
      {showGlow && draggingRange && (
        <RangeGlow
          range={draggingRange}
          min={min}
          max={max}
          height={height}
          intensity={glowIntensity * 0.7}
          color="#2196F3"
          animated={false}
        />
      )}

      {/* Tick marks and labels */}
      {ticks.map((value) => {
        const y = valueToY(value);
        const isMajor = value % (tickInterval * 5) === 0;
        const tickLength = isMajor ? 20 : 12;

        return (
          <g key={value}>
            {/* Tick mark */}
            <line
              x1={centerX - tickLength}
              y1={y}
              x2={centerX + tickLength}
              y2={y}
              stroke={value === 0 ? '#000' : '#666'}
              strokeWidth={isMajor ? 2 : 1}
              className="tick-mark"
            />

            {/* Number label */}
            {isMajor && (
              <text
                x={centerX - 40}
                y={y + 5}
                fontSize="14"
                fill="#333"
                textAnchor="end"
                className="tick-label"
              >
                {value}
              </text>
            )}
          </g>
        );
      })}

      {/* Arrow at top */}
      <polygon
        points={`${centerX},0 ${centerX - 8},15 ${centerX + 8},15`}
        fill="#333"
        className="arrow-top"
      />

      {/* Arrow at bottom */}
      <polygon
        points={`${centerX},${height} ${centerX - 8},${height - 15} ${centerX + 8},${height - 15}`}
        fill="#333"
        className="arrow-bottom"
      />
    </svg>
  );
};
