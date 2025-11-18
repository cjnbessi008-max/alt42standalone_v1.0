/**
 * Shared types for Alt42 Standalone App
 * Question handling and Interval Summary structures
 */

export interface Question {
  id: string;
  title: string;
  content: string;
  type: QuestionType;
  difficulty: 'easy' | 'medium' | 'hard';
  metadata: QuestionMetadata;
  createdAt: string;
  updatedAt: string;
}

export type QuestionType =
  | 'multiple_choice'
  | 'short_answer'
  | 'numerical'
  | 'mathematical_expression'
  | 'range_based';

export interface QuestionMetadata {
  subject?: string;
  topic?: string;
  tags?: string[];
  lmsId?: string; // Moodle question ID
  lmsSource?: string; // Moodle course ID or source
}

/**
 * Interval Summary: Automatically extracted range/interval information
 * from question content
 */
export interface IntervalSummary {
  questionId: string;
  intervals: Interval[];
  extractedAt: string;
  confidence: number; // 0-1, confidence in extraction accuracy
}

export interface Interval {
  type: IntervalType;
  start: number | string;
  end: number | string;
  inclusive: {
    start: boolean;
    end: boolean;
  };
  unit?: string; // e.g., 'cm', 'seconds', 'points'
  context?: string; // surrounding text for context
  rawText: string; // original text extracted from
}

export type IntervalType =
  | 'numerical_range' // e.g., [0, 10], 5~15
  | 'time_range' // e.g., 9:00-10:00, 1시간~2시간
  | 'score_range' // e.g., 80-100점
  | 'date_range' // e.g., 2024-01-01 ~ 2024-12-31
  | 'unknown';

/**
 * LMS Integration: Moodle question format
 */
export interface MoodleQuestion {
  id: number;
  name: string;
  questiontext: string;
  questiontextformat: number;
  generalfeedback?: string;
  defaultmark: number;
  qtype: string;
  category: number;
  parent: number;
  // Additional Moodle-specific fields can be added
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
