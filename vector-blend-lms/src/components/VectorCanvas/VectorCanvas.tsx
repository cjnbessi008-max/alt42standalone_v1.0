/**
 * Vector Blend LMS - Vector Canvas Component
 * Interactive SVG canvas for visualizing and manipulating vectors
 */

import React, { useRef, useState } from 'react';
import type { Vector2D } from '../../types/vector';
import { rgbToString } from '../../engine/color';
import { addVectors, magnitude } from '../../engine/vector';
import './VectorCanvas.css';

interface VectorCanvasProps {
  vectors: Vector2D[];
  showResultVector?: boolean;
  resultVector?: Vector2D;
  width?: number;
  height?: number;
  scale?: number;
  gridSize?: number;
  onVectorChange?: (vectors: Vector2D[]) => void;
  readonly?: boolean;
}

const VectorCanvas: React.FC<VectorCanvasProps> = ({
  vectors,
  showResultVector = true,
  resultVector,
  width = 400,
  height = 400,
  scale = 40,
  gridSize = 1,
  onVectorChange,
  readonly = false,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingVectorId, setDraggingVectorId] = useState<string | null>(null);
  const [hoveredVectorId, setHoveredVectorId] = useState<string | null>(null);

  const centerX = width / 2;
  const centerY = height / 2;

  // Convert world coordinates to screen coordinates
  const toScreen = (x: number, y: number) => ({
    x: centerX + x * scale,
    y: centerY - y * scale, // Flip Y axis (SVG Y increases downward)
  });

  // Convert screen coordinates to world coordinates
  const toWorld = (screenX: number, screenY: number) => ({
    x: (screenX - centerX) / scale,
    y: -(screenY - centerY) / scale, // Flip Y axis
  });

  // Handle mouse down on vector endpoint
  const handleVectorMouseDown = (vectorId: string, e: React.MouseEvent) => {
    if (readonly) return;
    e.preventDefault();
    setDraggingVectorId(vectorId);
  };

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingVectorId || readonly) return;

    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    const screenX = e.clientX - svgRect.left;
    const screenY = e.clientY - svgRect.top;
    const world = toWorld(screenX, screenY);

    // Update the dragged vector
    const updatedVectors = vectors.map((v) =>
      v.id === draggingVectorId ? { ...v, x: world.x, y: world.y } : v
    );

    onVectorChange?.(updatedVectors);
  };

  // Handle mouse up
  const handleMouseUp = () => {
    setDraggingVectorId(null);
  };

  // Calculate result vector if not provided
  const calculatedResultVector = resultVector || (vectors.length > 0 ? addVectors(...vectors) : null);

  return (
    <div className="vector-canvas-container">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="vector-canvas"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Grid */}
        <g className="grid">
          {Array.from({ length: Math.ceil(width / (scale * gridSize)) + 1 }, (_, i) => {
            const x = centerX + (i - Math.floor(width / (scale * gridSize) / 2)) * scale * gridSize;
            return (
              <line
                key={`grid-v-${i}`}
                x1={x}
                y1={0}
                x2={x}
                y2={height}
                stroke="#e0e0e0"
                strokeWidth={x === centerX ? 2 : 1}
              />
            );
          })}
          {Array.from({ length: Math.ceil(height / (scale * gridSize)) + 1 }, (_, i) => {
            const y = centerY + (i - Math.floor(height / (scale * gridSize) / 2)) * scale * gridSize;
            return (
              <line
                key={`grid-h-${i}`}
                x1={0}
                y1={y}
                x2={width}
                y2={y}
                stroke="#e0e0e0"
                strokeWidth={y === centerY ? 2 : 1}
              />
            );
          })}
        </g>

        {/* Origin */}
        <circle cx={centerX} cy={centerY} r={4} fill="#333" />

        {/* Vectors */}
        {vectors.map((vector, index) => {
          const end = toScreen(vector.x, vector.y);
          const isHovered = hoveredVectorId === vector.id;
          const isDragging = draggingVectorId === vector.id;
          const color = rgbToString(vector.color);

          return (
            <g key={vector.id || index} className="vector">
              {/* Vector line */}
              <line
                x1={centerX}
                y1={centerY}
                x2={end.x}
                y2={end.y}
                stroke={color}
                strokeWidth={isHovered || isDragging ? 4 : 3}
                markerEnd="url(#arrowhead)"
                opacity={isDragging ? 0.7 : 1}
              />

              {/* Arrowhead */}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill={color} />
                </marker>
              </defs>

              {/* Interactive endpoint */}
              {!readonly && (
                <circle
                  cx={end.x}
                  cy={end.y}
                  r={isHovered || isDragging ? 10 : 8}
                  fill={color}
                  stroke="white"
                  strokeWidth={2}
                  className="vector-endpoint"
                  onMouseDown={(e) => handleVectorMouseDown(vector.id || `${index}`, e)}
                  onMouseEnter={() => setHoveredVectorId(vector.id || `${index}`)}
                  onMouseLeave={() => setHoveredVectorId(null)}
                  style={{ cursor: 'move' }}
                />
              )}

              {/* Label */}
              {vector.label && (
                <text
                  x={end.x + 15}
                  y={end.y - 10}
                  fill="#333"
                  fontSize="12"
                  fontWeight="bold"
                >
                  {vector.label}
                </text>
              )}

              {/* Magnitude display */}
              <text
                x={centerX + (end.x - centerX) / 2}
                y={centerY + (end.y - centerY) / 2 - 10}
                fill={color}
                fontSize="10"
                textAnchor="middle"
              >
                {magnitude(vector).toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* Result vector */}
        {showResultVector && calculatedResultVector && (
          <g className="result-vector">
            {(() => {
              const end = toScreen(calculatedResultVector.x, calculatedResultVector.y);
              const color = rgbToString(calculatedResultVector.color);

              return (
                <>
                  <line
                    x1={centerX}
                    y1={centerY}
                    x2={end.x}
                    y2={end.y}
                    stroke={color}
                    strokeWidth={4}
                    strokeDasharray="8,4"
                    markerEnd="url(#arrowhead-result)"
                  />
                  <defs>
                    <marker
                      id="arrowhead-result"
                      markerWidth="12"
                      markerHeight="12"
                      refX="10"
                      refY="3"
                      orient="auto"
                    >
                      <polygon points="0 0, 12 3, 0 6" fill={color} />
                    </marker>
                  </defs>
                  <text
                    x={end.x + 15}
                    y={end.y + 20}
                    fill={color}
                    fontSize="14"
                    fontWeight="bold"
                  >
                    Result
                  </text>
                </>
              );
            })()}
          </g>
        )}
      </svg>
    </div>
  );
};

export default VectorCanvas;
