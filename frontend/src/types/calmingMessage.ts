/**
 * Type definitions for Calming Message feature
 */

export interface CalmingMessageConfig {
  module_id: string;
  is_enabled: boolean;
  difficulty_threshold: number;
  message_templates: Record<string, string>;
  audio_enabled: boolean;
  text_enabled: boolean;
  animation_type: 'breathing_circle' | 'pulse' | 'wave';
  timeout_seconds: number;
}

export interface CalmingMessageInteraction {
  id?: string;
  module_id: string;
  student_id: string;
  problem_id: string;
  difficulty_level: 1 | 2 | 3 | 4 | 5;
  message_type: 'audio' | 'visual' | 'combined';
  shown_at?: string;
  duration_viewed_seconds?: number;
  student_continued_immediately?: boolean;
  student_feedback?: boolean | null;
  feedback_at?: string;
}

export interface ProblemMetadata {
  problem_id: string;
  module_id: string;
  difficulty_level: 1 | 2 | 3 | 4 | 5;
  requires_calming_support: boolean;
  topic_tags?: string[];
  estimated_time_minutes?: number;
}

export interface CalmingMessageAnalytics {
  stats: {
    total_shown: number;
    avg_view_duration: number;
    helpful_count: number;
    not_helpful_count: number;
    immediate_continue_count: number;
    difficulty_level: number;
    unique_students: number;
  }[];
  recent_interactions: CalmingMessageInteraction[];
  summary: {
    total_interactions: number;
    average_helpfulness: number;
    most_common_difficulty: number | null;
  };
}
