import { ShapeType } from '../types/Shape';

/**
 * Generate SVG path for different shape types
 */
export const generateShapePath = (
  type: ShapeType,
  width: number,
  height: number
): string => {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2;

  switch (type) {
    case 'circle':
      // Circle doesn't need path, we'll use <circle> element
      return '';

    case 'square':
    case 'rectangle':
      return `M 0 0 L ${width} 0 L ${width} ${height} L 0 ${height} Z`;

    case 'triangle':
      return `M ${cx} 0 L ${width} ${height} L 0 ${height} Z`;

    case 'pentagon':
      return generatePolygonPath(5, cx, cy, radius);

    case 'hexagon':
      return generatePolygonPath(6, cx, cy, radius);

    default:
      return '';
  }
};

/**
 * Generate regular polygon path
 */
const generatePolygonPath = (
  sides: number,
  centerX: number,
  centerY: number,
  radius: number
): string => {
  const points: string[] = [];
  const angleStep = (2 * Math.PI) / sides;
  const startAngle = -Math.PI / 2; // Start from top

  for (let i = 0; i < sides; i++) {
    const angle = startAngle + i * angleStep;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    points.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
  }

  points.push('Z');
  return points.join(' ');
};

/**
 * Check if two shapes overlap
 */
export const checkOverlap = (
  x1: number, y1: number, w1: number, h1: number,
  x2: number, y2: number, w2: number, h2: number
): boolean => {
  return !(
    x1 + w1 < x2 ||
    x2 + w2 < x1 ||
    y1 + h1 < y2 ||
    y2 + h2 < y1
  );
};
