/**
 * Problem Types for AI Education System
 * Supports difficulty-based celebrations for easy problems
 */

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export type ProblemType = 'visualization' | 'addition' | 'subtraction' | 'multiplication' | 'division';

export interface Problem {
  id: string;
  moduleId: string;
  problemType: ProblemType;
  difficultyLevel: DifficultyLevel;
  createdAt: Date;
}

export interface StudentAttempt {
  id: string;
  studentId: string;
  problemId: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  attemptedAt: Date;
}

export interface FeedbackProps {
  isCorrect: boolean;
  difficultyLevel: DifficultyLevel;
  explanation?: string;
  onNext?: () => void;
  showCelebration?: boolean;
}

/**
 * Determines if a problem is "easy" and should trigger mini celebration
 */
export const isEasyProblem = (difficulty: DifficultyLevel): boolean => {
  return difficulty <= 2;
};
