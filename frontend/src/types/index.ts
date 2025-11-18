export interface Problem {
  id: number;
  title: string;
  equation_left: string;
  equation_right: string;
  solution: string;
  difficulty_level: 1 | 2 | 3 | 4;
  category: string;
  max_steps: number;
  time_limit: number;
}

export interface Hint {
  id: number;
  problem_id: number;
  hint_order: number;
  hint_text: string;
  penalty_points: number;
}

export interface ProblemWithHints extends Problem {
  hints?: Hint[];
}

export interface EquationStep {
  step: number;
  operation: 'add' | 'subtract' | 'multiply' | 'divide';
  value: number;
  leftSide: string;
  rightSide: string;
}

export interface StudentProgress {
  id: number;
  student_id: number;
  problem_id: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  attempts_count: number;
  hints_used: number;
  is_correct: boolean;
  final_score: number;
  time_spent: number;
}

export interface SubmitAttemptRequest {
  student_id: number;
  problem_id: number;
  steps_taken: EquationStep[];
  student_answer: string;
  time_spent: number;
  hints_used: number;
}

export interface SubmitAttemptResponse {
  is_correct: boolean;
  score: number;
  attempt_id: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
