import React from 'react';
import { LineDrawingProps } from '../../types';

/**
 * SVG line component with smooth Bezier curves
 */
const LineDrawing: React.FC<LineDrawingProps> = ({
  from,
  to,
  isCorrect,
  isActive = false,
}) => {
  // Calculate control points for smooth Bezier curve
  const controlPoint1X = from.x + (to.x - from.x) * 0.5;
  const controlPoint1Y = from.y;
  const controlPoint2X = from.x + (to.x - from.x) * 0.5;
  const controlPoint2Y = to.y;

  // Create SVG path with cubic Bezier curve
  const pathData = `M ${from.x},${from.y} C ${controlPoint1X},${controlPoint1Y} ${controlPoint2X},${controlPoint2Y} ${to.x},${to.y}`;

  // Determine line color based on state
  let strokeColor = '#4A90E2'; // Default blue
  if (isCorrect === true) strokeColor = '#4CAF50'; // Green for correct
  if (isCorrect === false) strokeColor = '#F44336'; // Red for incorrect
  if (isActive) strokeColor = '#FFA726'; // Orange for drawing

  return (
    <g className="correspondence-line">
      {/* Glow effect */}
      <path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth="6"
        strokeOpacity="0.2"
        strokeLinecap="round"
      />

      {/* Main line */}
      <path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          transition: 'stroke 0.3s ease',
          filter: isActive ? 'drop-shadow(0 0 4px rgba(255, 167, 38, 0.6))' : 'none',
        }}
      />

      {/* Endpoint circles */}
      <circle
        cx={from.x}
        cy={from.y}
        r="5"
        fill={strokeColor}
        opacity="0.8"
      />
      <circle
        cx={to.x}
        cy={to.y}
        r="5"
        fill={strokeColor}
        opacity="0.8"
      />

      {/* Animated pulse effect for active line */}
      {isActive && (
        <>
          <circle
            cx={from.x}
            cy={from.y}
            r="5"
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
          >
            <animate
              attributeName="r"
              from="5"
              to="12"
              dur="1s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              from="0.8"
              to="0"
              dur="1s"
              repeatCount="indefinite"
            />
          </circle>
        </>
      )}
    </g>
  );
};

export default LineDrawing;
