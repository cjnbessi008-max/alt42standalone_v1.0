/**
 * Focus Tracking TypeScript Types
 * Type definitions for focus tracking and mental alignment routines
 */

export enum BreakReason {
  IDLE_TIMEOUT = 'idle_timeout',
  WRONG_ANSWERS = 'wrong_answers',
  NO_INTERACTION = 'no_interaction',
  MANUAL = 'manual'
}

export enum RoutineType {
  BREATHING = 'breathing',
  STRETCHING = 'stretching',
  EYE_EXERCISE = 'eye_exercise'
}

export enum SyncStatus {
  PENDING = 'pending',
  SYNCED = 'synced',
  FAILED = 'failed'
}

export interface FocusSession {
  id: number;
  student_id: string;
  module_id: string;
  session_start: string;
  session_end?: string;
  total_duration_seconds?: number;
  active_duration_seconds: number;
  idle_duration_seconds: number;
  focus_score?: number;
  interaction_count: number;
  created_at: string;
  updated_at: string;
}

export interface FocusBreak {
  id: number;
  session_id: number;
  student_id: string;
  break_triggered_at: string;
  break_reason: BreakReason;
  idle_duration_seconds?: number;
  routine_started_at?: string;
  routine_completed_at?: string;
  routine_skipped: boolean;
  routine_type: RoutineType;
  effectiveness_rating?: number;
  notes?: Record<string, any>;
  created_at: string;
}

export interface MentalAlignmentRoutine {
  id: number;
  routine_type: RoutineType;
  title: string;
  description?: string;
  duration_seconds: number;
  instructions: string[];
  animation_config?: {
    type: string;
    colors?: string[];
    animation_duration?: number;
    positions?: string[];
    distance_indicator?: boolean;
    blink_counter?: boolean;
  };
  audio_cues?: Record<string, any>;
  is_active: boolean;
  usage_count: number;
  avg_effectiveness_rating?: number;
  created_at: string;
  updated_at: string;
}

export interface StudentFocusPreferences {
  id: number;
  student_id: string;
  idle_timeout_seconds: number;
  enable_focus_tracking: boolean;
  enable_auto_breaks: boolean;
  preferred_routine_type: RoutineType;
  break_frequency_minutes: number;
  notifications_enabled: boolean;
  preferences?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface FocusAnalytics {
  student_id: string;
  total_sessions: number;
  total_study_time_minutes: number;
  average_focus_score: number;
  total_breaks: number;
  most_common_break_reason?: BreakReason;
  favorite_routine_type?: RoutineType;
  completion_rate: number;
  avg_routine_effectiveness?: number;
}

export interface SessionSummary {
  session_id: number;
  duration_minutes: number;
  focus_score: number;
  break_count: number;
  interaction_count: number;
  date: string;
}

export interface BreakCheckResponse {
  should_trigger_break: boolean;
  break_reason?: BreakReason;
}
