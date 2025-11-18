/**
 * Type definitions for Divisor Molecules application
 */

export interface Molecule {
  id: string;
  number: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isDragging?: boolean;
}

export interface Problem {
  id: string;
  number: number;
  divisors: number[];
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit?: number;
}

export interface GameState {
  currentProblem: Problem | null;
  score: number;
  timeRemaining: number;
  foundDivisors: number[];
  isComplete: boolean;
}

export interface MoodleConfig {
  url: string;
  token: string;
  courseId: string;
}

export interface StudentProgress {
  studentId: string;
  problemId: string;
  score: number;
  timeSpent: number;
  attempts: number;
  completedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
