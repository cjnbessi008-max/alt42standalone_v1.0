export interface Student {
  id: string;
  name: string;
  email: string;
  grade_level: number;
  profile_image?: string;
  total_learning_time: number;
  consecutive_days: number;
  total_modules_completed: number;
  average_accuracy: number;
  created_at: string;
  last_activity_at?: string;
}

export interface Achievement {
  achievement_type: string;
  title: string;
  description: string;
  value?: number;
}

export interface PraiseCard {
  id: string;
  student_id: string;
  title: string;
  ai_message: string;
  card_design: string;
  likes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
  student?: {
    id: string;
    name: string;
    grade_level: number;
    profile_image?: string;
  };
  achievement?: Achievement;
}

export interface PraiseCardFeed {
  cards: PraiseCard[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface Comment {
  id: string;
  praise_card_id: string;
  student_id: string;
  comment_text: string;
  created_at: string;
}

export interface LearningSession {
  student_id: string;
  module_name: string;
  duration_minutes: number;
  questions_attempted: number;
  questions_correct: number;
  progress_percentage: number;
  metadata?: Record<string, any>;
}
