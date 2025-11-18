// Place Stair Problem Types
export interface PlaceStairProblem {
  id: number;
  type: 'identification' | 'composition' | 'decomposition' | 'comparison';
  number: number;
  question: string;
  maxDigits: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  hints?: string[];
  createdAt: Date;
}

// Student Answer
export interface StudentAnswer {
  problemId: number;
  studentId: number;
  answer: {
    ones?: number;
    tens?: number;
    hundreds?: number;
    thousands?: number;
    [key: string]: number | undefined;
  };
  timeSpent: number; // in seconds
  isCorrect?: boolean;
  feedback?: string;
}

// Moodle API Response
export interface MoodleApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Problem Generation Config
export interface ProblemConfig {
  minValue: number;
  maxValue: number;
  difficulty: number;
  count: number;
}

// Database Schema for Place Stair Module
export interface PlaceStairProgress {
  id: number;
  studentId: number;
  problemId: number;
  attempts: number;
  isCompleted: boolean;
  score: number;
  lastAttemptAt: Date;
}
