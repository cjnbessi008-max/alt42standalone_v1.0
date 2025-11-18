/**
 * Type definitions for emotion detection system
 */

export type EmotionType = 'frustration' | 'concentration' | 'confusion' | 'neutral';

export interface BehaviorEvent {
  student_id: string;
  session_id: string;
  module_id: string;
  event_type: 'click' | 'keypress' | 'mouse_move' | 'scroll' | 'focus' | 'blur';
  event_data?: Record<string, any>;
  duration_ms?: number;
  mouse_speed?: number;
  click_force?: number;
  keypress_speed?: number;
  page_url?: string;
  element_id?: string;
  element_type?: string;
  is_correct_answer?: 'correct' | 'incorrect' | 'partial' | 'na';
  attempt_number?: number;
  time_since_last_event_ms?: number;
}

export interface EmotionState {
  id: string;
  student_id: string;
  session_id: string;
  module_id: string;
  frustration_score: number;
  concentration_score: number;
  confusion_score: number;
  primary_emotion: EmotionType;
  confidence: number;
  events_analyzed: number;
  detected_at: string;
  analysis_method?: string;
}

export interface EmotionPattern {
  id: string;
  student_id: string;
  session_id: string;
  module_id: string;
  window_start: string;
  window_end: string;
  duration_minutes: number;
  frustration_count: number;
  concentration_count: number;
  confusion_count: number;
  neutral_count: number;
  dominant_emotion: EmotionType;
  emotion_transitions: number;
  is_concerning: 'yes' | 'no' | 'monitor';
  intervention_suggested: 'yes' | 'no';
  intervention_type?: string;
  avg_accuracy?: number;
  completion_rate?: number;
}

export interface EmotionDashboard {
  student_id: string;
  session_id: string;
  current_emotion: EmotionState | null;
  emotion_history: EmotionState[];
  pattern_analysis: EmotionPattern | null;
  alerts: string[];
  recommendations: string[];
}

export interface LMSConfig {
  lms_type: 'canvas' | 'moodle' | 'blackboard' | 'custom';
  lms_url: string;
  api_key?: string;
  webhook_url?: string;
  course_id?: string;
  send_alerts: boolean;
  alert_threshold: number;
}
