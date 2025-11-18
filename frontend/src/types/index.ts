// Frontend type definitions

export type UserRole = 'teacher' | 'student' | 'admin';

export type ProblemType =
  | 'fraction_addition'
  | 'fraction_subtraction'
  | 'fraction_multiplication'
  | 'fraction_division'
  | 'fraction_simplification'
  | 'fraction_visualization';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type ErrorType =
  | 'arithmetic_error'
  | 'conceptual_error'
  | 'simplification_error'
  | 'format_error'
  | null;

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
  type: ProblemType;
  difficulty: DifficultyLevel;
  problem_data: FractionProblemData;
  correct_answer: Fraction;
  visual_type?: string;
  tags?: string[];
  created_at: string;
}

export interface ErrorAnalysis {
  identified_mistake: string;
  explanation: string;
  hint: string;
  step_by_step?: string[];
  common_misconception?: string;
}

export interface SubmitAnswerResponse {
  submission_id: string;
  is_correct: boolean;
  is_equivalent: boolean;
  error_type?: ErrorType;
  error_analysis?: ErrorAnalysis;
  correct_answer: Fraction;
}

export interface StudentProgress {
  problem_type: ProblemType;
  total_attempts: number;
  correct_attempts: number;
  accuracy_percentage: number;
  average_time_seconds?: number;
  current_difficulty: DifficultyLevel;
  last_activity_at: string;
}

export interface ErrorPattern {
  problem_type: ProblemType;
  error_type: string;
  pattern_description?: string;
  occurrences: number;
  first_seen: string;
  last_seen: string;
  is_resolved: boolean;
}

export interface PerformanceSummary {
  problems_attempted: number;
  total_submissions: number;
  correct_submissions: number;
  overall_accuracy: number;
  avg_time_per_problem: number;
  days_active: number;
}
