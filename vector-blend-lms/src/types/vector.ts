/**
 * Vector Blend LMS - Type Definitions
 * Vector and Color types
 */

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

export interface Vector2D {
  x: number;
  y: number;
  color: RGB;
  label?: string;
  id?: string;
}

export interface VectorMath {
  magnitude: number;
  angle: number; // in radians
  angleInDegrees: number;
}

export interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}
