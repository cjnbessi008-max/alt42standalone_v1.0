export interface Point {
  x: number;
  y: number;
}

export interface CriticalPoint extends Point {
  type: 'maximum' | 'minimum' | 'saddle';
  value: number;
}

export interface InflectionPoint extends Point {
  value: number;
}

export interface Interval {
  start: number;
  end: number;
  type: 'increasing' | 'decreasing';
}

export interface GraphAnalysis {
  points: Point[];
  criticalPoints: CriticalPoint[];
  inflectionPoints: InflectionPoint[];
  intervals: Interval[];
  domain: { min: number; max: number };
}

export interface FunctionData {
  expression: string;
  parsed: boolean;
  error?: string;
}
