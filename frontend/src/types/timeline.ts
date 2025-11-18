export interface Student {
  id: string;
  name: string;
  email: string;
  grade_level: string;
  created_at: string;
  updated_at?: string;
}

export interface TimelineEvent {
  id: string;
  event_type: 'attempt' | 'module_start' | 'module_complete';
  timestamp: string;

  // For attempts
  problem_id?: string;
  problem_title?: string;
  problem_type?: string;
  difficulty_level?: number;
  is_correct?: boolean;
  time_spent_seconds?: number;
  answer_data?: Record<string, any>;

  // For module events
  module_id?: string;
  module_name?: string;
  progress_percentage?: number;

  // Additional context
  hint_used?: boolean;
  feedback?: string;
}

export interface Statistics {
  total_attempts: number;
  correct_attempts: number;
  accuracy_rate: number;
  total_time_seconds: number;
  average_time_per_attempt: number;
  modules_completed: number;
  hints_used: number;
  hint_usage_rate: number;
  problem_type_breakdown?: Record<string, { total: number; correct: number }>;
}

export interface StudentTimeline {
  student: Student;
  events: TimelineEvent[];
  statistics: Statistics;
}

export interface ModuleTimeline {
  student: Student;
  module_name: string;
  module_id: string;
  events: TimelineEvent[];
  statistics: Statistics;
}
