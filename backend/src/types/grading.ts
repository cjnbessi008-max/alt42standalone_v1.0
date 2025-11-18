/**
 * Backend Types for LMS Grading System
 */

export interface Student {
  id: string;
  name: string;
  email: string;
  studentId: string;
  createdAt: Date;
  updatedAt: Date;
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
  timeSpent?: number;
}

export interface ModuleProgress {
  id: string;
  moduleId: string;
  studentId: string;
  completedProblems: number;
  totalProblems: number;
  averageScore: number;
  startedAt: Date;
  completedAt?: Date;
  updatedAt: Date;
}

export interface Problem {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  correctAnswer: string;
  maxScore: number;
  difficulty: 'easy' | 'medium' | 'hard';
  orderIndex: number;
}

export interface GradingRule {
  id: string;
  problemId: string;
  ruleType: 'exact_match' | 'partial_match' | 'custom_function';
  ruleConfig: any;
  feedbackOnSuccess?: string;
  feedbackOnFailure?: string;
}

export interface LMSIntegration {
  id: string;
  lmsType: 'canvas' | 'moodle' | 'blackboard' | 'custom';
  apiEndpoint: string;
  apiKey: string;
  enabled: boolean;
  lastSyncAt?: Date;
}
