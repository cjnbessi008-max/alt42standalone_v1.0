/**
 * 타입 정의
 */

export interface Student {
  id: string;
  student_number: string;
  name: string;
  email?: string;
  grade_level?: string;
  lms_user_id?: string;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface StudentDetail extends Student {
  total_cards: number;
  total_learning_time: number;
  average_score?: number;
}

export interface Activity {
  title: string;
  description: string;
  duration_minutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  topic: string;
}

export interface ProgressSummary {
  current_topics: string[];
  strengths: string[];
  areas_for_improvement: string[];
  overall_progress: string;
}

export interface RoutineCard {
  id: string;
  student_id: string;
  card_date: string;
  title: string;
  learning_goals: string[];
  recommended_activities: Activity[];
  progress_summary: ProgressSummary;
  motivation_message: string;
  next_steps: string[];
  ai_metadata: Record<string, any>;
  status: 'draft' | 'active' | 'completed' | 'archived';
  viewed_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LearningProgress {
  id: string;
  student_id: string;
  subject: string;
  topic: string;
  completion_rate: number;
  score?: number;
  time_spent_minutes: number;
  last_activity_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CardGenerationRequest {
  student_id: string;
  card_date?: string;
  force_regenerate?: boolean;
}
