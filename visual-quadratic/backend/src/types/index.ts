export interface QuadraticCoefficients {
  a: number;
  b: number;
  c: number;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  target_a: number;
  target_b: number;
  target_c: number;
  difficulty: number;
  hints: string[];
  created_at: Date;
}

export interface StudentProgress {
  id: string;
  student_id: string;
  problem_id: string;
  attempts: number;
  completed: boolean;
  time_spent_seconds: number;
  best_score: number;
  last_attempt_at: Date;
  created_at: Date;
}

export interface Student {
  id: string;
  name: string;
  email?: string;
  grade_level?: string;
  moodle_user_id?: string;
  created_at: Date;
}

export interface Attempt {
  id: string;
  progress_id: string;
  submitted_a: number;
  submitted_b: number;
  submitted_c: number;
  accuracy_score: number;
  time_taken_seconds: number;
  created_at: Date;
}
