export type EventType =
  | 'problem_started'
  | 'input_changed'
  | 'interaction'
  | 'hint_requested'
  | 'answer_submitted'
  | 'answer_validated'
  | 'problem_completed'
  | 'session_paused'
  | 'session_resumed';

export interface TimelineEvent {
  id?: string;
  student_id: string;
  module_id: string;
  problem_id: string;
  session_id: string;
  event_type: EventType;
  event_data: Record<string, any>;
  timestamp?: Date;
  sequence_number: number;
  client_timestamp?: Date;
}

export interface SessionSummary {
  id?: string;
  session_id: string;
  student_id: string;
  module_id: string;
  problem_id: string;
  started_at: Date;
  completed_at?: Date;
  duration_seconds?: number;
  total_events: number;
  answer_attempts: number;
  hints_used: number;
  is_completed: boolean;
  is_correct?: boolean;
  final_answer?: Record<string, any>;
}

export interface SessionAnalytics extends SessionSummary {
  input_changes: number;
  ui_interactions: number;
  pause_count: number;
  active_duration_seconds?: number;
}

export interface StudentProgress {
  student_id: string;
  module_id: string;
  total_sessions: number;
  total_time_seconds: number;
  avg_session_duration: number;
  completed_sessions: number;
  correct_sessions: number;
  completion_rate: number;
  accuracy_rate: number;
  avg_attempts_per_problem: number;
  avg_hints_per_problem: number;
  first_session_at: Date;
  last_session_at: Date;
}
