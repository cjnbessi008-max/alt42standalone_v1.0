/**
 * Moodle Question Types
 */
export type QuestionType =
  | 'multichoice'    // 객관식
  | 'shortanswer'    // 단답형
  | 'numerical'      // 계산
  | 'essay'          // 서술형
  | 'truefalse';     // 참/거짓

/**
 * Question Difficulty Levels
 */
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

/**
 * Question Status
 */
export type QuestionStatus = 'not_started' | 'in_progress' | 'completed';

/**
 * Condition for Color Coding
 */
export interface Condition {
  difficulty: DifficultyLevel;
  type: QuestionType;
  status: QuestionStatus;
  timeSpent?: number; // in seconds
  attempts?: number;
}

/**
 * Moodle Question Interface
 */
export interface MoodleQuestion {
  id: number;
  name: string;
  questionText: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  status: QuestionStatus;
  maxScore: number;
  currentScore?: number;
  attempts: number;
  maxAttempts: number;
  timeSpent: number; // in seconds
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Color Configuration for Conditions
 */
export interface ColorConfig {
  difficulty: {
    easy: string;
    medium: string;
    hard: string;
  };
  status: {
    not_started: string;
    in_progress: string;
    completed: string;
  };
  type: {
    multichoice: string;
    shortanswer: string;
    numerical: string;
    essay: string;
    truefalse: string;
  };
}

/**
 * Default Color Configuration
 */
export const DEFAULT_COLOR_CONFIG: ColorConfig = {
  difficulty: {
    easy: '#4CAF50',      // Green
    medium: '#FF9800',    // Orange
    hard: '#F44336',      // Red
  },
  status: {
    not_started: '#9E9E9E',   // Gray
    in_progress: '#2196F3',   // Blue
    completed: '#4CAF50',     // Green
  },
  type: {
    multichoice: '#9C27B0',   // Purple
    shortanswer: '#00BCD4',   // Cyan
    numerical: '#FF5722',     // Deep Orange
    essay: '#795548',         // Brown
    truefalse: '#607D8B',     // Blue Gray
  },
};
