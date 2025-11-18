/**
 * Type definitions for Motivation Mode feature
 */

export enum ModeTrigger {
  STUDENT_INITIATED = 'student_initiated',
  SYSTEM_SUGGESTED = 'system_suggested',
  AUTO_DETECTED = 'auto_detected',
  TEACHER_ASSIGNED = 'teacher_assigned',
}

export enum ExitReason {
  STUDENT_CHOICE = 'student_choice',
  COMPLETED_GOAL = 'completed_goal',
  TIMEOUT = 'timeout',
  SYSTEM_ERROR = 'system_error',
  SESSION_LIMIT_REACHED = 'session_limit_reached',
}

export interface MotivationSession {
  id: string;
  studentId: string;
  moduleId: string;
  sessionStart: string;
  sessionEnd?: string;
  durationSeconds?: number;
  problemsCompleted: number;
  problemsCorrect: number;
  problemsIncorrect: number;
  maxStreak: number;
  currentStreak: number;
  modeTrigger: ModeTrigger;
  exitReason?: ExitReason;
}

export interface Problem {
  id: string;
  problemData: any;
  interactionType: 'form' | 'interactive' | 'drag_drop';
}

export interface SessionStats {
  completed: number;
  correct: number;
  currentStreak: number;
}

export interface ContinuationOption {
  action: 'continue' | 'exit';
  label: string;
}

export interface ContinuationPrompt {
  message: string;
  options: ContinuationOption[];
}

export interface Celebration {
  type: 'streak_milestone' | 'completion_milestone';
  value: number;
  animation: 'fire_celebration' | 'confetti';
}

export interface FeedbackResponse {
  isCorrect: boolean;
  feedback: string;
  streak: number;
  encouragementMessage?: string;
  nextActionPrompt: ContinuationPrompt;
  celebration?: Celebration;
}

export interface SessionSummary {
  sessionId: string;
  problemsCompleted: number;
  problemsCorrect: number;
  problemsIncorrect: number;
  maxStreak: number;
  durationSeconds?: number;
  accuracy: number;
  closingMessage: string;
  achievementHighlights: string[];
}

export interface ProblemSubmission {
  problemId: string;
  answer: any;
  timeSpentSeconds?: number;
}

export interface MotivationSuggestion {
  id: string;
  message: string;
  reason: string;
  moduleId: string;
  suggestedAt: string;
}

export interface SuggestionResponse {
  accepted: boolean;
  responseTimeSeconds?: number;
}
