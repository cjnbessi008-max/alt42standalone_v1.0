/**
 * TypeScript type definitions for DMN system
 */

export enum DMNStatus {
  DEEP_FOCUS = 'deep_focus',
  ACTIVE_LEARNING = 'active_learning',
  WANDERING = 'wandering',
  DISENGAGED = 'disengaged',
}

export interface DMNColorMap {
  [DMNStatus.DEEP_FOCUS]: string;
  [DMNStatus.ACTIVE_LEARNING]: string;
  [DMNStatus.WANDERING]: string;
  [DMNStatus.DISENGAGED]: string;
}

export const DMN_COLORS: DMNColorMap = {
  [DMNStatus.DEEP_FOCUS]: '#00C853',      // Green
  [DMNStatus.ACTIVE_LEARNING]: '#2196F3', // Blue
  [DMNStatus.WANDERING]: '#FFC107',       // Amber
  [DMNStatus.DISENGAGED]: '#F44336',      // Red
};

export const DMN_LABELS: Record<DMNStatus, { ko: string; en: string }> = {
  [DMNStatus.DEEP_FOCUS]: { ko: '깊은 집중', en: 'Deep Focus' },
  [DMNStatus.ACTIVE_LEARNING]: { ko: '활동적 학습', en: 'Active Learning' },
  [DMNStatus.WANDERING]: { ko: '주의 분산', en: 'Wandering' },
  [DMNStatus.DISENGAGED]: { ko: '이탈', en: 'Disengaged' },
};

export interface BehavioralMetrics {
  interaction_count: number;
  mouse_movement_intensity: number;
  keyboard_activity_rate: number;
  page_focus_duration: number;
  idle_time_seconds: number;
  click_frequency: number;
  scroll_activity: number;
}

export interface DMNStatusData {
  student_id: string;
  session_id: string;
  course_id: string;
  status: DMNStatus;
  color_code: string;
  confidence_score: number;
  metrics: BehavioralMetrics;
  analysis_window_seconds: number;
  recorded_at: string;
  metadata?: {
    engagement_score: number;
    analysis_method: string;
  };
}

export interface InteractionEvent {
  student_id: string;
  session_id: string;
  event_type: 'click' | 'keypress' | 'mouse_move' | 'scroll' | 'focus' | 'blur';
  event_data?: Record<string, any>;
  page_url?: string;
  element_target?: string;
  timestamp: string;
  time_since_session_start?: number;
}

export interface Student {
  id: string;
  moodle_user_id: number;
  username: string;
  full_name: string;
  email: string;
  grade_level?: string;
}

export interface Course {
  id: string;
  moodle_course_id: number;
  course_name: string;
  course_code: string;
  description?: string;
}

export interface LearningSession {
  id: string;
  student_id: string;
  course_id: string;
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  session_status: 'active' | 'completed';
}

export interface DMNAnalytics {
  student_id: string;
  course_id: string;
  date: string;
  hour?: number;
  deep_focus_percentage: number;
  active_learning_percentage: number;
  wandering_percentage: number;
  disengaged_percentage: number;
  total_sessions: number;
  avg_session_duration: number;
  total_interactions: number;
  avg_confidence_score: number;
  optimal_learning_time?: string;
  attention_pattern?: string;
}
