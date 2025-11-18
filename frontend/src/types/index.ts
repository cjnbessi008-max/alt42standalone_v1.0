/**
 * TypeScript type definitions
 */

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

export interface Student {
  id: number;
  moodle_user_id: number;
  username: string;
  email?: string;
  full_name?: string;
  grade_level?: string;
  created_at: string;
  updated_at: string;
}

export interface PatternType {
  id: number;
  name: string;
  description?: string;
  difficulty_level: DifficultyLevel;
  pattern_rule: string;
}

export interface Problem {
  id: number;
  pattern_type_id: number;
  moodle_question_id?: number;
  title: string;
  description?: string;
  initial_sequence: string[];
  pattern_hint?: string;
  difficulty_level: DifficultyLevel;
  time_limit_seconds: number;
  max_attempts: number;
  points: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  pattern_type?: PatternType;
}

export interface Attempt {
  id: number;
  student_id: number;
  problem_id: number;
  submitted_sequence: string[];
  is_correct: boolean;
  time_spent_seconds?: number;
  score: number;
  attempt_number: number;
  feedback?: string;
  submitted_at: string;
}

export interface StudentProgress {
  id: number;
  student_id: number;
  pattern_type_id: number;
  problems_attempted: number;
  problems_solved: number;
  total_score: number;
  average_time_seconds?: number;
  mastery_level: number;
  last_activity_at: string;
  pattern_type?: PatternType;
}

export interface GameState {
  currentProblem: Problem | null;
  currentSequence: string[];
  timeElapsed: number;
  attemptNumber: number;
  isPlaying: boolean;
  lastAttempt: Attempt | null;
}
