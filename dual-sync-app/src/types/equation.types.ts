export type EquationType = 'linear' | 'quadratic' | 'circle' | 'sine' | 'cosine' | 'exponential' | 'logarithm';

export interface Point {
  x: number;
  y: number;
}

export interface EquationParams {
  type: EquationType;
  // 1차 함수: y = ax + b
  // 2차 함수: y = ax² + bx + c
  a?: number;
  b?: number;
  c?: number;
  // 원: (x-h)² + (y-k)² = r²
  h?: number;
  k?: number;
  r?: number;
  // 삼각함수: y = a·sin(bx + c) + d 또는 y = a·cos(bx + c) + d
  d?: number;
  // 범위
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  equation: EquationParams;
  initialEquation?: string;
  hints?: string[];
}

export interface GraphData {
  points: Point[];
  equation: EquationParams;
}

export interface DualSyncState {
  equation: EquationParams;
  graphData: GraphData;
  equationString: string;
  isDragging: boolean;
  currentProblem: Problem | null;
}
