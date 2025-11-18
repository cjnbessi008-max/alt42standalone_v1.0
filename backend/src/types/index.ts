// Core Types for LMS Checkpoint System

export interface Problem {
  id: string;
  title: string;
  description: string;
  problem_type: 'math' | 'code' | 'text' | 'multiple_choice';
  difficulty: 'easy' | 'medium' | 'hard';
  correct_answer: string; // JSON string
  validation_rules: string; // JSON string
  hints: string | null; // JSON string
  max_attempts: number;
  time_limit_seconds: number | null;
  points: number;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  student_number: string | null;
  created_at: string;
}

export interface Submission {
  id: string;
  student_id: string;
  problem_id: string;
  answer: string; // JSON string
  status: 'pending' | 'validated' | 'submitted' | 'graded';
  score: number | null;
  feedback: string | null; // JSON string
  attempt_number: number;
  time_spent_seconds: number | null;
  submitted_at: string;
}

export interface CheckpointValidation {
  id: string;
  submission_id: string;
  validation_type: 'format' | 'range' | 'logic' | 'calculation';
  passed: boolean;
  error_message: string | null;
  warning_message: string | null;
  suggestions: string | null; // JSON array
  validated_at: string;
}

export interface LMSSync {
  id: string;
  submission_id: string;
  lms_submission_id: string | null;
  sync_status: 'pending' | 'synced' | 'failed';
  sync_attempts: number;
  last_sync_attempt: string | null;
  error_log: string | null;
  synced_at: string | null;
}

// Request/Response Types
export interface CreateSubmissionRequest {
  student_id: string;
  problem_id: string;
  answer: any; // Will be JSON stringified
  time_spent_seconds?: number;
}

export interface ValidateCheckpointRequest {
  submission_id: string;
  perform_full_validation?: boolean;
}

export interface ValidationResult {
  validation_type: 'format' | 'range' | 'logic' | 'calculation';
  passed: boolean;
  error_message?: string;
  warning_message?: string;
  suggestions?: string[];
}

export interface CheckpointResponse {
  submission_id: string;
  validations: ValidationResult[];
  overall_passed: boolean;
  can_submit: boolean;
  score_preview?: number;
  feedback_preview?: string;
}

export interface SubmitToLMSRequest {
  submission_id: string;
  force_submit?: boolean; // Override validation failures
}

export interface LMSSubmissionResponse {
  success: boolean;
  lms_submission_id?: string;
  message: string;
  sync_status: 'pending' | 'synced' | 'failed';
}

// Validation Rule Types
export interface MathValidationRule {
  type: 'quadratic' | 'linear' | 'pythagorean' | 'system';
  checks: string[];
  tolerance: number;
}

export interface ValidationRule {
  type: string;
  checks: string[];
  tolerance?: number;
  min?: number;
  max?: number;
  required_fields?: string[];
}
