// Database Models

export interface Student {
  id: string;
  moodle_user_id?: number;
  username: string;
  email?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Problem {
  id: string;
  moodle_question_id?: number;
  title: string;
  description?: string;
  instructions?: string;
  difficulty_level: number;
  time_limit_seconds: number;
  max_attempts: number;
  randomize_order: boolean;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CorrespondencePair {
  id: string;
  problem_id: string;
  left_item_id: string;
  left_item_text: string;
  left_item_image_url?: string;
  right_item_id: string;
  right_item_text: string;
  right_item_image_url?: string;
  is_correct_match: boolean;
  display_order: number;
  created_at: Date;
}

export interface Connection {
  leftId: string;
  rightId: string;
}

export interface InteractionEvent {
  timestamp: number;
  action: 'draw' | 'remove' | 'submit';
  leftId?: string;
  rightId?: string;
}

export interface StudentAnswer {
  id: string;
  student_id: string;
  problem_id: string;
  session_id?: string;
  drawn_connections: Connection[];
  is_correct?: boolean;
  score: number;
  time_spent_seconds?: number;
  attempt_number: number;
  interaction_sequence?: InteractionEvent[];
  started_at: Date;
  submitted_at?: Date;
}

// API Request/Response Types

export interface ProblemWithPairs extends Problem {
  left_items: Array<{
    id: string;
    text: string;
    image_url?: string;
    order: number;
  }>;
  right_items: Array<{
    id: string;
    text: string;
    image_url?: string;
    order: number;
  }>;
}

export interface SubmitAnswerRequest {
  student_id: string;
  problem_id: string;
  connections: Connection[];
  time_spent_seconds: number;
  interaction_sequence?: InteractionEvent[];
}

export interface SubmitAnswerResponse {
  is_correct: boolean;
  score: number;
  feedback: string;
  correct_answers?: Connection[];
  attempt_number: number;
  can_retry: boolean;
}

export interface ProblemStatistics {
  problem_id: string;
  title: string;
  difficulty_level: number;
  total_students: number;
  total_attempts: number;
  average_score: number;
  average_time_seconds: number;
  correct_attempts: number;
  success_rate: number;
}

export interface StudentProgress {
  student_id: string;
  username: string;
  problems_attempted: number;
  problems_correct: number;
  average_score: number;
  total_time_seconds: number;
  last_activity: Date;
}

// Moodle Integration Types

export interface MoodleUser {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
}

export interface MoodleQuestion {
  id: number;
  name: string;
  questiontext: string;
  qtype: string;
}
