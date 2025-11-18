/**
 * DraggableVector Component
 * Interactive vector component with drag support
 */

import React, { useRef } from 'react';
import { Vector2D, VectorComponent } from '../../types/vector.types';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';

interface DraggableVectorProps {
  vector: VectorComponent;
  origin: Vector2D;
  scale: number;
  onVectorChange: (id: string, newValue: Vector2D) => void;
  onSelect?: (id: string) => void;
  constraints?: {
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
  };
}

export const DraggableVector: React.FC<DraggableVectorProps> = ({
  vector,
  origin,
  scale,
  onVectorChange,
  onSelect,
  constraints,
}) => {
  const arrowRef = useRef<SVGGElement>(null);

  // Calculate screen coordinates from vector coordinates
  const endX = origin.x + vector.value.x * scale;
  const endY = origin.y - vector.value.y * scale; // Invert Y for screen coordinates

  const { handleDragStart } = useDragAndDrop({
    enabled: true,
    constraints,
    enableTouch: true,
    enableMouse: true,
    handlers: {
      onDragStart: (id) => {
        if (onSelect) onSelect(id);
      },
      onDrag: (id, position) => {
        // Convert screen coordinates back to vector coordinates
        const vectorX = (position.x - origin.x) / scale;
        const vectorY = -(position.y - origin.y) / scale; // Invert Y back

        onVectorChange(id, { x: vectorX, y: vectorY });
      },
    },
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    handleDragStart(vector.id, e.nativeEvent);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(vector.id, e.nativeEvent);
  };

  // Calculate arrow head points
  const arrowSize = 12;
  const angle = Math.atan2(-(vector.value.y * scale), vector.value.x * scale);
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
    <g ref={arrowRef} className="draggable-vector">
      {/* Vector line */}
      <line
        x1={origin.x}
        y1={origin.y}
        x2={endX}
        y2={endY}
        stroke={vector.color}
        strokeWidth={vector.isSelected ? 3 : 2}
        opacity={vector.isSelected ? 1 : 0.8}
      />

      {/* Arrow head */}
      <path d={arrowPath} fill={vector.color} opacity={vector.isSelected ? 1 : 0.8} />

      {/* Draggable handle at the end of vector */}
      <circle
        cx={endX}
        cy={endY}
        r={vector.isSelected ? 10 : 8}
        fill={vector.color}
        stroke="white"
        strokeWidth={2}
        opacity={0.9}
        style={{ cursor: 'grab' }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      />

      {/* Label */}
      {vector.label && (
        <text
          x={endX + 15}
          y={endY - 10}
          fill={vector.color}
          fontSize="14"
          fontWeight={vector.isSelected ? 'bold' : 'normal'}
        >
          {vector.label}
        </text>
      )}

      {/* Magnitude display */}
      <text
        x={origin.x + (endX - origin.x) / 2}
        y={origin.y + (endY - origin.y) / 2 - 10}
        fill={vector.color}
        fontSize="12"
        textAnchor="middle"
      >
        {`(${vector.value.x.toFixed(1)}, ${vector.value.y.toFixed(1)})`}
      </text>
    </g>
  );
};
