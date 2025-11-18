/**
 * Types for LMS Grading System with Visual Effects
 */

export interface Student {
  id: string;
  name: string;
  email: string;
  studentId: string;
}

export interface GradingResult {
  id: string;
  studentId: string;
  moduleId: string;
  problemId: string;
  answer: string;
  isCorrect: boolean;
  score: number;
  maxScore: number;
  feedback?: string;
  timestamp: Date;
  timeSpent?: number; // in seconds
}

export interface ModuleProgress {
  moduleId: string;
  studentId: string;
  completedProblems: number;
  totalProblems: number;
  averageScore: number;
  startedAt: Date;
  completedAt?: Date;
}

export type VisualEffect = 'success-pulse' | 'error-crack' | 'none';

export interface GradingDisplayConfig {
  showAnimation: boolean;
  animationDuration: number; // in milliseconds
  soundEnabled: boolean;
  accessibilityMode: boolean;
}
