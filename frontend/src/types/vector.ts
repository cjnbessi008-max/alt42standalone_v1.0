/**
 * Type definitions for vector transformation module
 */

export type ProblemType = "rotation" | "scaling" | "combined";

export interface Vector {
  x: number;
  y: number;
}

export interface VectorProblem {
  id: string;
  module_id: string;
  problem_type: ProblemType;
  initial_x: number;
  initial_y: number;
  rotation_angle?: number;
  scale_x?: number;
  scale_y?: number;
  expected_x: number;
  expected_y: number;
  difficulty_level: number;
  animation_duration: number;
  created_at: string;
}

export interface StudentAttempt {
  student_id: string;
  problem_id: string;
  answer_x: number;
  answer_y: number;
  time_spent_seconds: number;
  hint_used: boolean;
}

export interface StudentAttemptResponse extends StudentAttempt {
  id: string;
  is_correct: boolean;
  attempts_count: number;
  attempted_at: string;
}

export interface TransformationState {
  progress: number; // 0 to 1
  currentVector: Vector;
  isAnimating: boolean;
}
