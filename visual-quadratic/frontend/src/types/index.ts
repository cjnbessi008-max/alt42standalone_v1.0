export interface QuadraticCoefficients {
  a: number;
  b: number;
  c: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Root {
  x: number;
  type: 'real' | 'complex';
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  targetEquation: QuadraticCoefficients;
  difficulty: number;
  hints?: string[];
}

export interface StudentProgress {
  problemId: string;
  attempts: number;
  completed: boolean;
  timeSpent: number;
  lastAttempt?: Date;
}
