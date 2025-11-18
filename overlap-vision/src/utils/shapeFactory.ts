import { Shape, ShapeType } from '../types/Shape';

let shapeIdCounter = 0;

export const createShape = (
  type: ShapeType,
  x: number = 0,
  y: number = 0,
  color: string = '#3b82f6'
): Shape => {
  const id = `shape-${++shapeIdCounter}`;

  // Default size based on shape type
  const defaultSize = type === 'circle' ? 80 : 80;

  return {
    id,
    type,
    position: { x, y },
    size: { width: defaultSize, height: defaultSize },
    fill: color,
    opacity: 0.6,
    blendMode: 'normal',
    rotation: 0,
    zIndex: shapeIdCounter,
  };
};

export const getRandomColor = (): string => {
  const colors = [
    '#ef4444', // red
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const getRandomPosition = (containerWidth: number, containerHeight: number, shapeSize: number) => {
  return {
    x: Math.random() * (containerWidth - shapeSize),
    y: Math.random() * (containerHeight - shapeSize),
  };
};
