/**
 * TypeScript type definitions for emotion-based color mode system
 */

export type ColorMode = 'neutral' | 'calming' | 'energetic' | 'refresh';
export type EmotionalState = 'calm' | 'stressed' | 'engaged' | 'tired';
export type DetectionSensitivity = 'low' | 'medium' | 'high';
export type TriggerReason =
  | 'auto_emotion_detection'
  | 'user_manual'
  | 'session_start'
  | 'preference_load'
  | 'admin_override';

export interface BehaviorMetrics {
  avg_click_interval: number; // seconds
  error_rate: number; // 0.0 to 1.0
  task_completion_rate: number; // 0.0 to 1.0
  idle_time_seconds: number;
  retry_count: number;
  session_duration_minutes: number;
}

export interface EmotionDetectionResult {
  student_id: number;
  session_id: string;
  detected_emotion: EmotionalState;
  confidence: number;
  recommended_mode: ColorMode;
  should_switch: boolean;
  reason: string;
  all_scores: Record<string, number>;
  processing_time_ms: number;
  current_mode: ColorMode;
}

export interface CurrentEmotionState {
  student_id: number;
  session_id: string;
  current_emotion: EmotionalState | null;
  current_mode: ColorMode;
  last_updated: string | null;
  auto_mode_enabled: boolean;
}

export interface StudentColorPreferences {
  student_id: number;
  auto_mode_enabled: boolean;
  preferred_default_mode: ColorMode;
  emotion_detection_sensitivity: DetectionSensitivity;
  disabled_modes: ColorMode[];
  allow_data_collection: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BehaviorEvent {
  event_type: 'click' | 'scroll' | 'input' | 'submit' | 'error' | 'idle' | 'focus' | 'blur';
  element_id?: string;
  task_id?: number;
  timestamp: string;
  time_since_last_event?: number;
  time_on_element?: number;
  is_error?: boolean;
  retry_number?: number;
  page_url?: string;
  metadata?: Record<string, any>;
}

export interface ColorModeChangeEvent {
  event: 'color_mode_change';
  data: {
    student_id: number;
    session_id: string;
    previous_mode: ColorMode;
    new_mode: ColorMode;
    emotional_state: EmotionalState;
    reason: string;
    timestamp: string;
    transition_duration_ms: number;
  };
}

export interface EmotionDetectedEvent {
  event: 'emotion_detected';
  data: {
    student_id: number;
    detected_emotion: EmotionalState;
    confidence: number;
    timestamp: string;
  };
}

export type WebSocketMessage = ColorModeChangeEvent | EmotionDetectedEvent;
