// Frontend Types matching backend API

export interface Problem {
  id: string;
  title: string;
  description: string;
  problem_type: 'math' | 'code' | 'text' | 'multiple_choice';
  difficulty: 'easy' | 'medium' | 'hard';
  hints: string[] | null;
  max_attempts: number;
  time_limit_seconds: number | null;
  points: number;
  created_at: string;
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

export interface Submission {
  id: string;
  student_id: string;
  problem_id: string;
  answer: any;
  status: 'pending' | 'validated' | 'submitted' | 'graded';
  score: number | null;
  feedback: any;
  attempt_number: number;
  time_spent_seconds: number | null;
  submitted_at: string;
}

export interface LMSSubmissionResponse {
  success: boolean;
  lms_submission_id?: string;
  message: string;
  sync_status: 'pending' | 'synced' | 'failed';
}

// UI-specific types
export interface AnswerInput {
  [key: string]: any;
}
