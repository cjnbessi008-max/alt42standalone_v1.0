// Triangle types
export interface Point {
  x: number;
  y: number;
}

export interface Triangle {
  id: string;
  vertices: [Point, Point, Point];
  color: string;
  isTarget: boolean;
  scaleFactor?: number;
}

export interface TriangleSides {
  AB: number;
  BC: number;
  CA: number;
}

// Problem types
export interface Problem {
  id: string;
  moodleId?: string;
  title: string;
  description: string;
  sourceTriangle: Triangle;
  targetTriangle: Triangle;
  requiredScaleFactor: number;
  tolerance: number;
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: string;
}

// Student attempt types
export interface StudentAttempt {
  id: string;
  studentId: string;
  problemId: string;
  submittedTriangle: Triangle;
  submittedScaleFactor: number;
  isCorrect: boolean;
  accuracy: number;
  timeSpentSeconds: number;
  attemptedAt: string;
}

// UI state types
export interface AppState {
  currentProblem: Problem | null;
  currentTriangle: Triangle;
  isScaling: boolean;
  isDragging: boolean;
  startTime: number | null;
  attempts: number;
}

// Moodle integration types
export interface MoodleProblem {
  id: string;
  courseid: number;
  name: string;
  description: string;
  problemdata: string; // JSON string
  timemodified: number;
}

export interface MoodleSession {
  token: string;
  studentId: string;
  courseId: number;
}
