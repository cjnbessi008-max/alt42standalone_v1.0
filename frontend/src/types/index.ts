// Type definitions for Quantifier Friends app

export type QuantifierType = 'universal' | 'existential';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Problem {
  id: string;
  moodleId?: number;
  title: string;
  description?: string;
  quantifierType: QuantifierType;
  statement: string;
  options: any[];
  correctAnswer: any;
  difficulty: Difficulty;
  characterId?: string;
  explanation?: string;
  hints?: string[];
  tags?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  id: string;
  problemId: string;
  studentId: string;
  studentAnswer: any;
  isCorrect: boolean;
  score: number;
  timeSpent?: number;
  hintsUsed: number;
  attempts: number;
  feedback?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface Progress {
  id: string;
  studentId: string;
  universalQuantifierScore: number;
  existentialQuantifierScore: number;
  totalProblemsAttempted: number;
  totalProblemsCorrect: number;
  overallAccuracy: number;
  averageTimePerProblem?: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
  experiencePoints: number;
  achievements: string[];
  weakAreas: WeakArea[];
  lastActivityAt?: string;
}

export interface WeakArea {
  type: string;
  accuracy: string;
  attempts: number;
}

export interface Character {
  id: string;
  name: string;
  avatar: string;
  color: string;
  personality: string;
  quantifierType: QuantifierType;
}

export interface SubmitAnswerRequest {
  problemId: string;
  studentId: string;
  studentAnswer: any;
  timeSpent?: number;
  hintsUsed?: number;
}

export interface SubmitAnswerResponse {
  submission: Submission;
  feedback: string;
  explanation?: string;
}
