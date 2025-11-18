export interface User {
  id: number;
  username: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  created_at: string;
}

export interface Quiz {
  id: number;
  title: string;
  description: string;
  created_by: number;
  time_limit: number | null;
  passing_score: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  creator_name?: string;
  question_count?: number;
  questions?: Question[];
}

export interface Question {
  id: number;
  quiz_id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  points: number;
  order_num: number;
  options?: AnswerOption[];
}

export interface AnswerOption {
  id: number;
  question_id: number;
  option_text: string;
  is_correct?: boolean;
  order_num: number;
}

export interface QuizAttempt {
  id: number;
  quiz_id: number;
  user_id: number;
  started_at: string;
  completed_at: string | null;
  score: number | null;
  total_points: number;
  earned_points: number;
  is_completed: boolean;
  quiz_title?: string;
  answers?: UserAnswer[];
}

export interface UserAnswer {
  id: number;
  attempt_id: number;
  question_id: number;
  selected_option_id: number | null;
  answer_text: string | null;
  is_correct: boolean;
  points_earned: number;
  answered_at: string;
}

export interface FocusSettings {
  id?: number;
  user_id?: number;
  blur_intensity: number; // 0-10
  dim_opacity: number; // 0-100
  hide_timer: boolean;
  hide_score: boolean;
  hide_navigation: boolean;
  fullscreen_mode: boolean;
  sound_enabled: boolean;
  theme: 'light' | 'dark' | 'auto';
}

export interface QuizState {
  quiz: Quiz | null;
  attempt: QuizAttempt | null;
  currentQuestionIndex: number;
  answers: Map<number, number | string>;
  timeRemaining: number | null;
  isLoading: boolean;
}
