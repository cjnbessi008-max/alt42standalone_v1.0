/**
 * TypeScript type definitions for the application
 */

export interface Student {
  id: string;
  name: string;
  email: string;
  grade_level?: number;
  institution?: string;
  external_lms_id?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Problem {
  id: string;
  module_id: string;
  problem_type: string;
  content: Record<string, any>;
  difficulty_level: number;
  correct_answer: Record<string, any>;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface StudentAttempt {
  id: string;
  student_id: string;
  problem_id: string;
  module_id: string;
  submitted_answer: Record<string, any>;
  is_correct: boolean;
  time_spent_seconds?: number;
  attempt_number: number;
  attempted_at: string;
  metadata: Record<string, any>;
}

export interface MistakePattern {
  id: string;
  student_id: string;
  module_id?: string;
  pattern_type: string;
  pattern_category?: string;
  description?: string;
  frequency: number;
  severity: 'low' | 'medium' | 'high';
  problem_types: string[];
  example_attempts: string[];
  pattern_data: Record<string, any>;
  first_occurrence: string;
  last_occurrence: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MistakeWarning {
  id: string;
  student_id: string;
  problem_id: string;
  pattern_id: string;
  warning_type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  is_dismissed: boolean;
  shown_at: string;
  dismissed_at?: string;
  metadata: Record<string, any>;
}

export interface WarningCheckResponse {
  has_warnings: boolean;
  warnings: MistakeWarning[];
  recommended_focus_areas: string[];
}

export interface PatternAnalysisResponse {
  student_id: string;
  patterns: MistakePattern[];
  total_patterns: number;
  analysis_timestamp: string;
}

export interface PatternSummary {
  total_patterns: number;
  severity_breakdown: {
    high: number;
    medium: number;
    low: number;
  };
  by_category: Record<string, number>;
  patterns: MistakePattern[];
}
