import React from 'react';
import { Shape } from '../types/Shape';
import { generateShapePath } from '../utils/geometryUtils';

interface ShapeRendererProps {
  shapes: Shape[];
  onShapeClick?: (shapeId: string) => void;
  selectedShapeId?: string | null;
}

export const ShapeRenderer: React.FC<ShapeRendererProps> = ({
  shapes,
  onShapeClick,
  selectedShapeId,
}) => {
  const renderShape = (shape: Shape) => {
    const { id, type, position, size, fill, opacity, blendMode, rotation } = shape;
    const isSelected = selectedShapeId === id;

    const commonProps = {
      fill,
      opacity,
      style: { mixBlendMode: blendMode },
      onClick: () => onShapeClick?.(id),
      cursor: 'pointer',
      stroke: isSelected ? '#ffffff' : 'none',
      strokeWidth: isSelected ? 3 : 0,
      strokeDasharray: isSelected ? '5,5' : 'none',
    };

    const transform = `translate(${position.x}, ${position.y}) rotate(${rotation} ${size.width / 2} ${size.height / 2})`;

    if (type === 'circle') {
      const radius = Math.min(size.width, size.height) / 2;
      return (
        <circle
          key={id}
          cx={position.x + radius}
          cy={position.y + radius}
          r={radius}
          {...commonProps}
        />
      );
    }

    const path = generateShapePath(type, size.width, size.height);

    return (
      <path
        key={id}
        d={path}
        transform={transform}
        {...commonProps}
      />
    );
  };

  // Sort shapes by zIndex
  const sortedShapes = [...shapes].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: 'absolute', top: 0, left: 0 }}
    >
      {sortedShapes.map(renderShape)}
    </svg>
  );
};
