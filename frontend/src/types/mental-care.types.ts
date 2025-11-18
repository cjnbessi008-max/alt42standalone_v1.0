/**
 * TypeScript type definitions for Mental Care messaging system
 */

export enum MessageType {
  ENCOURAGEMENT = 'encouragement',
  BREAK_SUGGESTION = 'break_suggestion',
  STRATEGY_TIP = 'strategy_tip',
  CELEBRATION = 'celebration',
}

export enum MessageSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface MentalCareMessage {
  message_id: string;
  message_type: MessageType;
  trigger_reason: string;
  text_ko: string;
  text_en: string;
  severity: MessageSeverity;
  recommended_actions: string[];
  sent_at: string;
  read_at?: string;
  student_reaction?: 'helpful' | 'not_helpful' | 'neutral';
}

export interface StudentProgress {
  student_id: string;
  module_id: string;
  total_attempts: number;
  correct_attempts: number;
  accuracy_rate: number;
  total_time_seconds: number;
  average_time_per_problem: number;
  first_attempt?: string;
  last_attempt?: string;
}

export interface AnalysisResponse {
  student_id: string;
  module_id: string;
  current_speed_score: number | null;
  accuracy_rate: number | null;
  speed_trend: string | null;
  problems_in_window: number;
  triggers_detected: string[];
  message_sent: MentalCareMessage | null;
}

export interface AttemptSubmission {
  student_id: string;
  module_id: string;
  problem_id: string;
  is_correct: boolean;
  time_spent_seconds: number;
  hints_used?: number;
  attempts_count?: number;
  difficulty_level?: number;
}

export interface WebSocketMessage {
  type: 'mental_care_message' | 'connection_established' | 'echo';
  data?: any;
  student_id?: string;
  timestamp?: string;
}
