// Core Types for Emotion Tracking System

export type EmotionType = 'happy' | 'neutral' | 'confused' | 'frustrated' | 'confident';

export type LMSType = 'canvas' | 'moodle' | 'google_classroom' | 'kaist';

export type ActivityType = 'lecture' | 'assignment' | 'quiz' | 'reading' | 'discussion' | 'video';

export type EmotionTrend = 'improving' | 'stable' | 'declining';

export interface Student {
  id: string;
  lms_id: string;
  lms_type: LMSType;
  name: string;
  email?: string;
  grade_level?: number;
  created_at: Date;
  updated_at: Date;
}

export interface LearningSession {
  id: string;
  student_id: string;
  course_id: string;
  course_name: string;
  started_at: Date;
  ended_at?: Date;
  duration_minutes?: number;
  activity_type?: ActivityType;
  created_at: Date;
}

export interface EmotionRecord {
  id: string;
  student_id: string;
  session_id?: string;
  emotion_type: EmotionType;
  intensity: number; // 1-5
  note?: string;
  context?: any;
  recorded_at: Date;
  created_at: Date;
}

export interface DailyEmotionSummary {
  id: string;
  student_id: string;
  summary_date: Date;
  total_learning_minutes: number;
  session_count: number;
  emotion_distribution: Record<EmotionType, number>;
  dominant_emotion: EmotionType;
  average_intensity: number;
  emotion_trend: EmotionTrend;
  notes?: string;
  generated_at: Date;
}

export interface LMSIntegration {
  id: string;
  institution_name: string;
  lms_type: LMSType;
  lms_url: string;
  client_id: string;
  client_secret_encrypted: string;
  access_token_encrypted?: string;
  refresh_token_encrypted?: string;
  token_expires_at?: Date;
  is_active: boolean;
  config?: any;
  created_at: Date;
  updated_at: Date;
}

// API Request/Response Types

export interface CreateEmotionRequest {
  student_id: string;
  session_id?: string;
  emotion_type: EmotionType;
  intensity: number;
  note?: string;
  context?: any;
}

export interface CreateSessionRequest {
  student_id: string;
  course_id: string;
  course_name: string;
  activity_type?: ActivityType;
}

export interface EndSessionRequest {
  ended_at?: Date;
}

export interface LMSConnectRequest {
  lms_type: LMSType;
  institution_name: string;
  lms_url: string;
  client_id: string;
  client_secret: string;
  config?: any;
}

export interface StudentTrendsResponse {
  student_id: string;
  student_name: string;
  period: {
    start_date: Date;
    end_date: Date;
  };
  overall_trend: EmotionTrend;
  emotion_timeline: Array<{
    date: Date;
    dominant_emotion: EmotionType;
    average_intensity: number;
  }>;
  emotion_frequency: Record<EmotionType, number>;
  total_learning_hours: number;
}

export interface CorrelationAnalysis {
  student_id: string;
  correlation_score: number; // -1 to 1
  insights: string[];
  emotion_performance_pairs: Array<{
    emotion: EmotionType;
    average_score: number;
    sample_size: number;
  }>;
}
