import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTriangleStore } from '../store/triangleStore';

interface Point {
  x: number;
  y: number;
}

interface Triangle {
  label: string;
  vertices: [Point, Point, Point];
  sides?: [number, number, number];
  angles?: [number, number, number];
  similarityGroup?: number;
}

interface TriangleVisualizationProps {
  problemData: any;
  width?: number;
  height?: number;
  interactive?: boolean;
}

const TriangleVisualization: React.FC<TriangleVisualizationProps> = ({
  problemData,
  width = 500,
  height = 400,
  interactive = true,
}) => {
  const { selectedTriangle, selectTriangle, highlightedGroups } = useTriangleStore();
  const [hoveredTriangle, setHoveredTriangle] = useState<Triangle | null>(null);
  const [triangles, setTriangles] = useState<Triangle[]>([]);

  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
  const defaultColor = '#9CA3AF';

  useEffect(() => {
    if (problemData?.problemData?.triangles) {
      setTriangles(problemData.problemData.triangles);
    }
  }, [problemData]);

  const getTriangleColor = (triangle: Triangle, index: number): string => {
    // If triangle is selected
    if (selectedTriangle?.label === triangle.label) {
      return '#F59E0B'; // Highlight color (amber)
    }

    // If triangle belongs to a highlighted group
    if (triangle.similarityGroup !== undefined && highlightedGroups.includes(triangle.similarityGroup)) {
      return colors[triangle.similarityGroup % colors.length];
    }

    // If hovered
    if (interactive && hoveredTriangle?.label === triangle.label) {
      return '#6B7280'; // Gray on hover
    }

    // Default
    return defaultColor;
  };

  const getTriangleOpacity = (triangle: Triangle): number => {
    if (!interactive) return 0.3;

    if (selectedTriangle || highlightedGroups.length > 0) {
      if (
        selectedTriangle?.label === triangle.label ||
        (triangle.similarityGroup !== undefined && highlightedGroups.includes(triangle.similarityGroup))
      ) {
        return 0.6;
      }
      return 0.15;
    }

    if (hoveredTriangle?.label === triangle.label) {
      return 0.5;
    }

    return 0.3;
  };

  const handleTriangleClick = (triangle: Triangle) => {
    if (!interactive) return;

    if (selectedTriangle?.label === triangle.label) {
      selectTriangle(null);
    } else {
      selectTriangle(triangle);
    }
  };

  const renderTriangle = (triangle: Triangle, index: number) => {
    const [p1, p2, p3] = triangle.vertices;
    const pathData = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} Z`;

    const color = getTriangleColor(triangle, index);
    const opacity = getTriangleOpacity(triangle);

    // Calculate centroid for label
    const centroidX = (p1.x + p2.x + p3.x) / 3;
    const centroidY = (p1.y + p2.y + p3.y) / 3;

    return (
      <g key={`triangle-${index}`}>
        {/* Triangle Path */}
        <motion.path
          d={pathData}
          fill={color}
          fillOpacity={opacity}
          stroke={color}
          strokeWidth={2}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: index * 0.1 }}
          style={{ cursor: interactive ? 'pointer' : 'default' }}
          onClick={() => handleTriangleClick(triangle)}
          onMouseEnter={() => interactive && setHoveredTriangle(triangle)}
          onMouseLeave={() => interactive && setHoveredTriangle(null)}
        />

        {/* Vertices */}
        {[p1, p2, p3].map((point, pIndex) => (
          <motion.circle
            key={`vertex-${index}-${pIndex}`}
            cx={point.x}
            cy={point.y}
            r={4}
            fill={color}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
          />
        ))}

        {/* Label */}
        <motion.text
          x={centroidX}
          y={centroidY}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#1F2937"
          fontSize="14"
          fontWeight="bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: index * 0.1 + 0.5 }}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {triangle.label}
        </motion.text>

        {/* Side labels (optional - show on hover or selection) */}
        {(hoveredTriangle?.label === triangle.label || selectedTriangle?.label === triangle.label) &&
          triangle.sides && (
            <>
              {/* Side 1: p1-p2 */}
              <text
                x={(p1.x + p2.x) / 2}
                y={(p1.y + p2.y) / 2 - 10}
                textAnchor="middle"
                fill="#374151"
                fontSize="10"
                style={{ pointerEvents: 'none' }}
              >
                {triangle.sides[0].toFixed(1)}
              </text>

              {/* Side 2: p2-p3 */}
              <text
                x={(p2.x + p3.x) / 2}
                y={(p2.y + p3.y) / 2 - 10}
                textAnchor="middle"
                fill="#374151"
                fontSize="10"
                style={{ pointerEvents: 'none' }}
              >
                {triangle.sides[1].toFixed(1)}
              </text>

              {/* Side 3: p3-p1 */}
              <text
                x={(p3.x + p1.x) / 2}
                y={(p3.y + p1.y) / 2 - 10}
                textAnchor="middle"
                fill="#374151"
                fontSize="10"
                style={{ pointerEvents: 'none' }}
              >
                {triangle.sides[2].toFixed(1)}
              </text>
            </>
          )}
      </g>
    );
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 500 400"
      style={{
        background: 'white',
        borderRadius: '8px',
      }}
    >
      {/* Grid Background (optional) */}
      <defs>
        <pattern
          id="grid"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 20 0 L 0 0 0 20"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="500" height="400" fill="url(#grid)" />

      {/* Render all triangles */}
      {triangles.map((triangle, index) => renderTriangle(triangle, index))}

      {/* Legend for similarity groups */}
      {interactive && highlightedGroups.length > 0 && (
        <g transform="translate(10, 10)">
          <rect width="120" height="30" fill="white" fillOpacity="0.9" rx="5" />
          <text x="10" y="20" fontSize="12" fill="#374151" fontWeight="bold">
            유사 삼각형 그룹
          </text>
        </g>
      )}
    </svg>
  );
};

export default TriangleVisualization;
