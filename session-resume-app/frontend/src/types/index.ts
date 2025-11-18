/**
 * TypeScript type definitions
 */

export interface SessionState {
  id: string;
  student_id: string;
  module_id: string;
  current_problem_id: string | null;
  problem_index: number;
  total_problems: number;
  session_data: {
    completed_problems: string[];
    hints_used: Record<string, number>;
    problem_sequence: string[];
    ui_state: Record<string, any>;
  };
  is_completed: boolean;
  progress_percentage: number;
  started_at: string;
  last_active_at: string;
  completed_at: string | null;
  has_previous_session: boolean;
}

export interface DraftAnswer {
  id: string;
  draft_answer: Record<string, any>;
  time_spent_seconds: number;
  hints_viewed: number;
  saved_at: string;
  has_draft: boolean;
}

export interface ResumeInfo {
  has_session: boolean;
  session?: {
    id: string;
    current_problem_index: number;
    total_problems: number;
    progress_percentage: number;
    last_active_at: string;
    time_since_last_active: string;
    can_resume: boolean;
    expired_reason?: string;
  };
}

export interface SessionStartResponse {
  session: SessionState;
  draft_answer: DraftAnswer | null;
}
