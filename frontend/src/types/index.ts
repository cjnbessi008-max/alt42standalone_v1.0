/**
 * Type definitions for LMS Hint System
 */

export type HintType = 'conceptual' | 'strategic' | 'procedural';

export interface HintRequest {
  student_id: string;
  problem_id: string;
  problem_description: string;
  student_work?: string;
  previous_hints?: string[];
  hint_level?: number;
  subject?: string;
  grade_level?: string;
}

export interface HintResponse {
  hint_id: string;
  hint_text: string;
  hint_type: HintType;
  hint_level: number;
  next_hint_available: boolean;
  created_at: string;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  subject: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  grade_level?: string;
}

export interface StudentProgress {
  student_id: string;
  problem_id: string;
  attempts: number;
  hints_received: string[];
  current_hint_level: number;
  started_at: string;
  completed_at?: string;
  completed: boolean;
}

export interface LMSContext {
  user: {
    id: string;
    name: string;
    email: string;
    roles: string[];
  };
  context: {
    id: string;
    title: string;
    label: string;
  };
  resource: {
    id: string;
    title: string;
  };
}
