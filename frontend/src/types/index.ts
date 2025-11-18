// API Types

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

export interface CorrespondenceItem {
  id: string;
  text: string;
  image_url?: string;
  order: number;
}

export interface Problem {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  difficulty_level: number;
  time_limit_seconds: number;
  max_attempts: number;
  randomize_order: boolean;
  left_items: CorrespondenceItem[];
  right_items: CorrespondenceItem[];
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

// Component Props

export interface LineDrawingProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  isCorrect?: boolean;
  isActive?: boolean;
}

export interface ItemPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}
