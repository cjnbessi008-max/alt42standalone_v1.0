/**
 * Shared type definitions for the LMS Hint System
 * Used across backend and frontend
 */

/**
 * Hint levels enum
 */
export enum HintLevel {
  LEVEL_1 = 1, // Light hint - general direction
  LEVEL_2 = 2, // Medium hint - specific steps
  LEVEL_3 = 3, // Detailed hint - near-complete explanation
}

/**
 * Hint request from student
 */
export interface HintRequest {
  studentId: string;
  moduleId: string;
  problemId: string;
  level: HintLevel;
  context?: {
    currentAttempt?: string;
    previousHints?: string[];
    timeSpent?: number;
  };
}

/**
 * Hint response from system
 */
export interface HintResponse {
  id: string;
  problemId: string;
  level: HintLevel;
  content: string;
  generatedAt: string;
  metadata?: {
    generationTime: number;
    modelUsed: string;
    tokenCount?: number;
  };
}

/**
 * Problem definition
 */
export interface Problem {
  id: string;
  moduleId: string;
  type: string;
  question: string;
  difficulty: number;
  correctAnswer: string;
  createdAt: string;
}

/**
 * Student progress tracking
 */
export interface StudentProgress {
  studentId: string;
  moduleId: string;
  problemId: string;
  hintsUsed: HintLevel[];
  attempts: number;
  completed: boolean;
  completedAt?: string;
}

/**
 * LMS integration - LTI context
 */
export interface LTIContext {
  contextId: string;
  resourceLinkId: string;
  userId: string;
  roles: string[];
  consumerKey: string;
  returnUrl?: string;
}

/**
 * Module metadata
 */
export interface Module {
  id: string;
  name: string;
  description: string;
  subject: string;
  gradeLevel: string;
  teacherId: string;
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
}

/**
 * Hint usage analytics
 */
export interface HintAnalytics {
  problemId: string;
  level: HintLevel;
  usageCount: number;
  averageTimeBeforeRequest: number;
  successRateAfterHint: number;
}
