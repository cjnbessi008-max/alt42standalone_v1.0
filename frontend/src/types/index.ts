/**
 * TypeScript Type Definitions
 * DMN Drift Tracking System
 */

export interface Student {
  id: number;
  moodle_user_id?: number;
  username: string;
  email: string;
  full_name: string;
  grade_level?: string;
  created_at: string;
  updated_at: string;
}

export interface LearningSession {
  id: number;
  student_id: number;
  module_name: string;
  session_start: string;
  session_end?: string;
  total_duration_seconds: number;
  activity_count: number;
  dmn_drift_score: number;
  status: 'active' | 'completed' | 'abandoned';
  accuracy_rate?: number;
  total_attempts?: number;
  correct_attempts?: number;
  created_at: string;
  updated_at: string;
}

export type EventType =
  | 'click'
  | 'keypress'
  | 'scroll'
  | 'focus_loss'
  | 'focus_gain'
  | 'answer_submit'
  | 'idle_start'
  | 'idle_end'
  | 'mouse_move';

export interface InteractionEvent {
  id?: number;
  session_id: number;
  student_id: number;
  event_type: EventType;
  event_data?: Record<string, any>;
  response_time_ms?: number;
  timestamp: string;
}

export interface ProblemAttempt {
  id?: number;
  session_id: number;
  student_id: number;
  problem_id: string;
  problem_type: string;
  difficulty_level: number;
  attempt_number: number;
  is_correct: boolean;
  response_time_seconds: number;
  hint_used: boolean;
  skip_count: number;
  attempted_at: string;
}

export type DriftLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface DmnDriftMetrics {
  id?: number;
  session_id: number;
  student_id: number;
  time_window_start: string;
  time_window_end: string;

  // Response time metrics
  avg_response_time_ms: number;
  response_time_variance: number;
  response_time_trend: number;

  // Accuracy metrics
  accuracy_rate: number;
  accuracy_trend: number;

  // Interaction metrics
  click_frequency: number;
  click_pattern_irregularity: number;
  scroll_activity_score: number;

  // Idle metrics
  idle_time_seconds: number;
  idle_event_count: number;

  // Focus metrics
  focus_loss_count: number;
  tab_switch_count: number;

  // Composite score
  dmn_drift_score: number;
  drift_level: DriftLevel;

  // Recommendations
  intervention_needed: boolean;
  recommended_action?: string;

  calculated_at: string;
}

export interface TeacherIntervention {
  id?: number;
  student_id: number;
  session_id?: number;
  metric_id?: number;
  teacher_id?: number;
  intervention_type: 'message' | 'break_reminder' | 'difficulty_adjustment' | 'encouragement' | 'custom';
  intervention_text?: string;
  was_automated: boolean;
  delivered_at: string;
  student_response?: string;
  effectiveness_rating?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AggregateStats {
  avg_drift_score: number;
  max_drift_score: number;
  min_drift_score: number;
  avg_accuracy: number;
  total_measurements: number;
  drift_level_distribution: Record<DriftLevel, number>;
}
