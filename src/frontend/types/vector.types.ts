/**
 * Vector Type Definitions
 * Core types for 2D vector mathematics and operations
 */

export interface Vector2D {
  x: number;
  y: number;
}

export interface VectorComponent {
  id: string;
  value: Vector2D;
  color: string;
  label?: string;
  isSelected?: boolean;
}

export interface VectorGraphState {
  origin: Vector2D;
  scale: number;
  gridSize: number;
  showGrid: boolean;
  showAxes: boolean;
  axisRange: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  };
}

export interface VectorTransform {
  translate: Vector2D;
  rotate: number; // in radians
  scale: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type VectorOperation = 'add' | 'subtract' | 'scale' | 'rotate' | 'normalize';
