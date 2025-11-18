import React from 'react';
import type { RangeGlowProps } from './types';
import './RangeGlow.css';

export const RangeGlow: React.FC<RangeGlowProps> = ({
  range,
  min,
  max,
  height,
  intensity = 1,
  color = '#4CAF50',
  animated = true,
}) => {
  // Calculate positions on the vertical line
  const totalRange = max - min;
  const startPercent = ((range.start - min) / totalRange) * 100;
  const endPercent = ((range.end - min) / totalRange) * 100;

  // Calculate Y positions (inverted because SVG Y increases downward)
  const startY = (height * (100 - startPercent)) / 100;
  const endY = (height * (100 - endPercent)) / 100;
  const rangeHeight = Math.abs(startY - endY);
  const topY = Math.min(startY, endY);

  return (
    <g className={animated ? 'range-glow-animated' : 'range-glow'}>
      {/* Define glow filter */}
      <defs>
        <filter id="glow-filter" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={3 * intensity} result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Gradient for smooth color transition */}
        <linearGradient id="range-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.2 }} />
          <stop offset="50%" style={{ stopColor: color, stopOpacity: 0.6 }} />
          <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.2 }} />
        </linearGradient>

        {/* Animated gradient for pulsing effect */}
        {animated && (
          <linearGradient id="range-gradient-animated" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.2 }}>
              <animate
                attributeName="stop-opacity"
                values="0.2;0.4;0.2"
                dur="2s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="50%" style={{ stopColor: color, stopOpacity: 0.8 }}>
              <animate
                attributeName="stop-opacity"
                values="0.6;0.9;0.6"
                dur="2s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.2 }}>
              <animate
                attributeName="stop-opacity"
                values="0.2;0.4;0.2"
                dur="2s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
        )}
      </defs>

      {/* Outer glow layer */}
      <rect
        x={-30}
        y={topY}
        width={60}
        height={rangeHeight}
        fill={animated ? 'url(#range-gradient-animated)' : 'url(#range-gradient)'}
        filter="url(#glow-filter)"
        rx={5}
      />

      {/* Inner highlight layer */}
      <rect
        x={-15}
        y={topY}
        width={30}
        height={rangeHeight}
        fill={color}
        fillOpacity={0.3}
        rx={3}
      />

      {/* Range boundary indicators */}
      <circle
        cx={0}
        cy={startY}
        r={6}
        fill={color}
        filter="url(#glow-filter)"
        className={animated ? 'boundary-pulse' : ''}
      />
      <circle
        cx={0}
        cy={endY}
        r={6}
        fill={color}
        filter="url(#glow-filter)"
        className={animated ? 'boundary-pulse' : ''}
      />

      {/* Range labels */}
      <text
        x={25}
        y={startY + 5}
        fill={color}
        fontSize="14"
        fontWeight="bold"
        className="range-label"
      >
        {range.start}
      </text>
      <text
        x={25}
        y={endY + 5}
        fill={color}
        fontSize="14"
        fontWeight="bold"
        className="range-label"
      >
        {range.end}
      </text>
    </g>
  );
};
