// Type definitions for the application

export type UserRole = 'teacher' | 'student' | 'admin';

export type ProblemType =
  | 'fraction_addition'
  | 'fraction_subtraction'
  | 'fraction_multiplication'
  | 'fraction_division'
  | 'fraction_simplification'
  | 'fraction_visualization'
  | 'arithmetic_addition'
  | 'arithmetic_subtraction'
  | 'arithmetic_multiplication'
  | 'arithmetic_division';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type ErrorType =
  | 'arithmetic_error'
  | 'conceptual_error'
  | 'simplification_error'
  | 'format_error'
  | null;

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  grade_level?: string;
  institution: string;
  created_at: Date;
  updated_at: Date;
}

export interface Fraction {
  numerator: number;
  denominator: number;
}

export interface FractionProblemData {
  numerator1: number;
  denominator1: number;
  numerator2?: number;
  denominator2?: number;
  operation: 'add' | 'subtract' | 'multiply' | 'divide' | 'simplify' | 'identify';
}

export interface Problem {
  id: string;
  created_by?: string;
  type: ProblemType;
  difficulty: DifficultyLevel;
  problem_data: FractionProblemData | Record<string, unknown>;
  correct_answer: Fraction | Record<string, unknown>;
  visual_type?: string;
  tags?: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ErrorAnalysis {
  identified_mistake: string;
  explanation: string;
  hint: string;
  step_by_step?: string[];
  common_misconception?: string;
}

export interface Submission {
  id: string;
  student_id: string;
  problem_id: string;
  student_answer: Fraction | Record<string, unknown>;
  is_correct: boolean;
  is_equivalent: boolean;
  error_type: ErrorType;
  error_analysis?: ErrorAnalysis;
  time_spent_seconds?: number;
  attempt_number: number;
  submitted_at: Date;
}

export interface ErrorPattern {
  id: string;
  student_id: string;
  problem_type: ProblemType;
  error_type: string;
  pattern_description?: string;
  occurrences: number;
  first_seen: Date;
  last_seen: Date;
  is_resolved: boolean;
  resolved_at?: Date;
}

export interface StudentProgress {
  id: string;
  student_id: string;
  problem_type: ProblemType;
  total_attempts: number;
  correct_attempts: number;
  accuracy_percentage: number;
  average_time_seconds?: number;
  total_time_seconds: number;
  current_difficulty: DifficultyLevel;
  started_at: Date;
  last_activity_at: Date;
}

export interface AIFeedbackCache {
  id: string;
  cache_key: string;
  problem_type: ProblemType;
  error_type: string;
  feedback: ErrorAnalysis;
  usage_count: number;
  last_used_at: Date;
  created_at: Date;
  expires_at?: Date;
}

// Request/Response types for API
export interface CreateProblemRequest {
  type: ProblemType;
  difficulty: DifficultyLevel;
  problem_data: FractionProblemData | Record<string, unknown>;
  correct_answer: Fraction | Record<string, unknown>;
  visual_type?: string;
  tags?: string[];
}

export interface SubmitAnswerRequest {
  student_answer: Fraction | Record<string, unknown>;
  time_spent_seconds?: number;
}

export interface SubmitAnswerResponse {
  submission_id: string;
  is_correct: boolean;
  is_equivalent: boolean;
  error_type?: ErrorType;
  error_analysis?: ErrorAnalysis;
  correct_answer: Fraction | Record<string, unknown>;
}

export interface ValidationResult {
  is_correct: boolean;
  is_equivalent: boolean;
  error_type: ErrorType;
}

export interface AnalyticsQuery {
  student_id?: string;
  problem_type?: ProblemType;
  start_date?: Date;
  end_date?: Date;
}
