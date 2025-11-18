/**
 * Type Definitions for Logical Linker
 */

export type LogicalOperatorType = 'and' | 'or' | 'if_then';

export type QuestionType = 'and' | 'or' | 'if_then' | 'mixed';

export type AnimationType = 'flow' | 'pulse' | 'connect' | 'branch';

export interface LogicalOperator {
  id: number;
  operator_type: LogicalOperatorType;
  korean_name: string;
  english_name: string;
  symbol: string;
  description: string;
  color_code: string;
  animation_type: AnimationType;
  created_at: string;
}

export interface QuestionOperator {
  operator_id: number;
  operator_type: LogicalOperatorType;
  korean_name: string;
  color_code: string;
  animation_type: AnimationType;
  position: number;
  operand_left: string;
  operand_right: string;
  expected_result: boolean;
}

export interface Question {
  id: number;
  moodle_question_id: number;
  title: string;
  description: string;
  question_type: QuestionType;
  difficulty_level: number;
  operators: QuestionOperator[];
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: number;
  moodle_user_id: number;
  username: string;
  full_name?: string;
  email?: string;
  grade_level?: string;
  created_at: string;
  updated_at: string;
  last_active_at?: string;
}

export interface StudentProgress {
  id: number;
  student_id: number;
  question_id: number;
  session_id: string;
  attempt_number: number;
  is_correct: boolean;
  time_spent_seconds: number;
  interaction_count: number;
  started_at: string;
  completed_at?: string;
  answer_data: Record<string, any>;
}

export interface StudentStats {
  total_attempts: number;
  correct_answers: number;
  incorrect_answers: number;
  avg_time_spent: number;
  avg_interactions: number;
  unique_questions: number;
  accuracy_rate: number;
}

export interface AnimationSettings {
  id: number;
  name: string;
  duration_ms: number;
  easing_function: string;
  config_json: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: number;
  session_id: string;
  student_id: number;
  device_info?: string;
  ip_address?: string;
  started_at: string;
  last_activity_at: string;
  ended_at?: string;
  is_active: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: number;
    details?: any;
  };
  count?: number;
  message?: string;
}

// Component Props Types
export interface SmartphoneScreenProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
}

export interface LogicalLinkAnimationProps {
  operator: QuestionOperator;
  fromPosition: { x: number; y: number };
  toPosition: { x: number; y: number };
  duration?: number;
  onComplete?: () => void;
}

export interface OperandNodeProps {
  id: string;
  text: string;
  position: { x: number; y: number };
  isActive?: boolean;
  isCorrect?: boolean;
  onClick?: () => void;
}

export interface QuestionDisplayProps {
  question: Question;
  onAnswer: (answer: Record<string, any>) => void;
  onComplete: (isCorrect: boolean) => void;
}

// Store Types
export interface AppState {
  currentQuestion: Question | null;
  currentStudent: Student | null;
  sessionId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentQuestion: (question: Question | null) => void;
  setCurrentStudent: (student: Student | null) => void;
  setSessionId: (sessionId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export interface ProgressState {
  currentProgress: StudentProgress | null;
  progressHistory: StudentProgress[];
  stats: StudentStats | null;
  interactionCount: number;
  startTime: number | null;

  // Actions
  startProgress: (studentId: number, questionId: number, sessionId: string) => void;
  updateProgress: (data: Partial<StudentProgress>) => void;
  completeProgress: (isCorrect: boolean) => void;
  incrementInteraction: () => void;
  loadStats: (studentId: number) => Promise<void>;
  reset: () => void;
}

// Utility Types
export type OperatorColor = {
  [K in LogicalOperatorType]: string;
};

export type OperatorSymbol = {
  [K in LogicalOperatorType]: string;
};

export const OPERATOR_COLORS: OperatorColor = {
  and: '#4CAF50',
  or: '#2196F3',
  if_then: '#FF9800',
};

export const OPERATOR_SYMBOLS: OperatorSymbol = {
  and: '∧',
  or: '∨',
  if_then: '→',
};

export const OPERATOR_KOREAN_NAMES = {
  and: '그리고',
  or: '또는',
  if_then: '이면',
} as const;
