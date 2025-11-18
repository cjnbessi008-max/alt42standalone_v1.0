/**
 * TypeScript type definitions for the application
 */

export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  role: string;
  institution?: string;
  grade_level?: string;
  created_at: string;
  updated_at: string;
}

export interface FocusSession {
  id: number;
  user_id: number;
  module_name?: string;
  session_start: string;
  session_end?: string;
  total_duration_seconds?: number;
  active_time_seconds: number;
  idle_time_seconds: number;
  interaction_count: number;
  context_switches: number;
  average_focus_score?: number;
  engagement_score?: number;
  day_of_week: number;
  hour_of_day: number;
  created_at: string;
  updated_at: string;
}

export interface FocusMetric {
  id: number;
  session_id: number;
  recorded_at: string;
  event_type: string;
  event_data?: Record<string, any>;
  time_since_last_event_seconds?: number;
  focus_score?: number;
  page_url?: string;
  component_name?: string;
}

export interface TimeRecommendation {
  id: number;
  user_id: number;
  recommended_day_of_week: number;
  recommended_hour: number;
  recommended_duration_minutes: number;
  confidence_score: number;
  average_focus_score: number;
  sample_size: number;
  analysis_data?: Record<string, any>;
  generated_at: string;
  valid_until?: string;
  is_active: number;
}

export interface FocusTrend {
  user_id: number;
  total_sessions: number;
  average_focus_score: number;
  average_engagement_score: number;
  max_focus_score: number;
  min_focus_score: number;
  trend: "improving" | "declining" | "stable" | "insufficient_data";
  analysis_period_days: number;
}

export interface TimePattern {
  sufficient_data: boolean;
  session_count: number;
  hourly_patterns?: Record<string, HourlyPattern>;
  daily_patterns?: Record<string, DailyPattern>;
  time_slot_patterns?: Record<string, TimeSlotPattern>;
  analysis_period_days?: number;
}

export interface HourlyPattern {
  average_score: number;
  std_dev: number;
  session_count: number;
  max_score: number;
  min_score: number;
}

export interface DailyPattern {
  day_name: string;
  average_score: number;
  std_dev: number;
  session_count: number;
  max_score: number;
  min_score: number;
}

export interface TimeSlotPattern {
  day: number;
  hour: number;
  average_score: number;
  session_count: number;
}

export interface RecommendationSummary {
  user_id: number;
  total_recommendations: number;
  has_recommendations: boolean;
  top_recommendations?: TimeRecommendation[];
  optimal_days?: string[];
  optimal_hours?: number[];
  average_confidence?: number;
}
