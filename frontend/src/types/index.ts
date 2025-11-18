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
  created_at: string;
  updated_at: string;
}

export interface LearningSession {
  id: string;
  student_id: string;
  course_id: string;
  course_name: string;
  started_at: string;
  ended_at?: string;
  duration_minutes?: number;
  activity_type?: ActivityType;
  created_at: string;
}

export interface EmotionRecord {
  id: string;
  student_id: string;
  session_id?: string;
  emotion_type: EmotionType;
  intensity: number;
  note?: string;
  context?: any;
  recorded_at: string;
  created_at: string;
}

export interface DailyEmotionSummary {
  id: string;
  student_id: string;
  summary_date: string;
  total_learning_minutes: number;
  session_count: number;
  emotion_distribution: Record<EmotionType, number>;
  dominant_emotion: EmotionType;
  average_intensity: number;
  emotion_trend: EmotionTrend;
  notes?: string;
  generated_at: string;
}

export interface EmotionOption {
  type: EmotionType;
  label: string;
  emoji: string;
  color: string;
}
