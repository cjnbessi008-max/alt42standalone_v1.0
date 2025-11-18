// TypeScript type definitions

export interface Point {
  x: number;
  y: number;
}

export interface FunctionData {
  id: string;
  expression: string;
  color: string;
  points: Point[];
}

export interface TangentLine {
  point: Point;
  slope: number;
  color: string;
}

export interface ProblemData {
  id: number;
  functionExpression: string;
  domain: [number, number];
  point: number;
  questionType: 'derivative' | 'inverse_derivative' | 'both';
  moodleQuestionId?: number;
}

export interface StudentProgress {
  studentId: number;
  problemId: number;
  attempts: number;
  completed: boolean;
  score: number;
  timeSpent: number;
}

export interface MoodleConfig {
  baseUrl: string;
  token: string;
  courseId: number;
}
