// Geometry types for Length Assist feature

export type ShapeType = 'line' | 'triangle' | 'rectangle' | 'square' | 'circle';

export type MeasurementUnit = 'px' | 'cm' | 'arbitrary';

export interface Point {
  x: number;
  y: number;
}

export interface GeometricShape {
  id: string;
  type: ShapeType;
  position: Point;
  rotation: number;
  isDraggable: boolean;
  color: string;
  label?: string;

  // Shape-specific properties
  width?: number;
  height?: number;
  radius?: number;
  points?: Point[]; // For polygons
}

export interface Line {
  id: string;
  start: Point;
  end: Point;
  length: number;
  color: string;
  label?: string;
  isDraggable: boolean;
}

export interface Measurement {
  lineId: string;
  length: number;
  unit: MeasurementUnit;
  label: string;
}

export interface RatioCalculation {
  line1Id: string;
  line2Id: string;
  line1Length: number;
  line2Length: number;
  ratio: number;
  simplifiedRatio?: string; // e.g., "3:2"
  percentage?: number;
}

export interface LengthAssistProblem {
  id: string;
  title: string;
  description: string;
  shapes: GeometricShape[];
  lines: Line[];
  targetRatio?: RatioCalculation;
  hints?: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  unit: MeasurementUnit;
}

export interface StudentAttempt {
  problemId: string;
  studentId: string;
  measuredRatio: RatioCalculation;
  isCorrect: boolean;
  timeSpent: number; // seconds
  interactions: InteractionEvent[];
  attemptedAt: Date;
}

export interface InteractionEvent {
  type: 'drag' | 'click' | 'measure' | 'calculate';
  timestamp: number;
  elementId: string;
  position?: Point;
  data?: any;
}

export interface CanvasConfig {
  width: number;
  height: number;
  backgroundColor: string;
  gridEnabled: boolean;
  snapToGrid: boolean;
  gridSize: number;
}
