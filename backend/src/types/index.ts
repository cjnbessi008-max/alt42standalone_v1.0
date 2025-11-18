// Type definitions for backend

export interface Point {
  x: number;
  y: number;
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

export interface GeometricShape {
  id: string;
  type: 'line' | 'triangle' | 'rectangle' | 'square' | 'circle';
  position: Point;
  rotation: number;
  isDraggable: boolean;
  color: string;
  label?: string;
  width?: number;
  height?: number;
  radius?: number;
}

export interface LengthAssistProblem {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  shapes: GeometricShape[];
  lines: Line[];
  targetRatio: number;
  tolerance: number;
  hints?: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  unit: string;
  createdAt: Date;
}

export interface StudentAttempt {
  id: string;
  problemId: string;
  studentId: string;
  measuredRatio: number;
  line1Length: number;
  line2Length: number;
  isCorrect: boolean;
  timeSpent: number;
  interactions: any[];
  attemptedAt: Date;
}

export interface StudentProgress {
  studentId: string;
  moduleId: string;
  problemsCompleted: number;
  totalProblems: number;
  accuracyRate: number;
  averageTimePerProblem: number;
  lastActivityAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface MoodleLTIPayload {
  userId: string;
  courseId: string;
  contextId: string;
  resourceLinkId: string;
  roles: string[];
  lisPersonNameGiven?: string;
  lisPersonNameFamily?: string;
  lisPersonContactEmailPrimary?: string;
}
