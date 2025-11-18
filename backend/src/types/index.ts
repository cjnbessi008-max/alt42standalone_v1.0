export interface User {
  id: number;
  moodle_user_id?: number;
  username: string;
  email: string;
  full_name: string;
  role: 'student' | 'teacher' | 'admin';
  created_at: Date;
  updated_at: Date;
}

export interface Problem {
  id: number;
  moodle_problem_id?: number;
  title: string;
  equation_left: string;
  equation_right: string;
  solution: string;
  difficulty_level: 1 | 2 | 3 | 4;
  category: string;
  max_steps: number;
  time_limit: number;
  created_by?: number;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export interface Hint {
  id: number;
  problem_id: number;
  hint_order: number;
  hint_text: string;
  penalty_points: number;
  created_at: Date;
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
  started_at?: Date;
  completed_at?: Date;
  last_attempt_at: Date;
}

export interface EquationStep {
  step: number;
  operation: 'add' | 'subtract' | 'multiply' | 'divide';
  value: number;
  leftSide: string;
  rightSide: string;
}

export interface ProblemAttempt {
  id: number;
  progress_id: number;
  student_id: number;
  problem_id: number;
  attempt_number: number;
  steps_taken: EquationStep[];
  student_answer?: string;
  is_correct: boolean;
  score: number;
  time_spent: number;
  hints_used_in_attempt: number;
  error_type?: string;
  attempted_at: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ProblemWithHints extends Problem {
  hints?: Hint[];
}

export interface ProgressWithDetails extends StudentProgress {
  problem?: Problem;
  attempts?: ProblemAttempt[];
}
