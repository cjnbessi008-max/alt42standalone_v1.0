// User types
export enum UserRole {
  STUDENT = "student",
  TEACHER = "teacher",
  ADMIN = "admin",
}

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: UserRole;
  grade_level?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface UserRegister {
  email: string;
  username: string;
  password: string;
  full_name: string;
  role: UserRole;
  grade_level?: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

// Problem types
export enum ProblemType {
  MULTIPLE_CHOICE = "multiple_choice",
  SHORT_ANSWER = "short_answer",
  ESSAY = "essay",
  MATH = "math",
  CODING = "coding",
}

export enum DifficultyLevel {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
}

export interface Problem {
  id: string;
  title: string;
  problem_type: ProblemType;
  difficulty_level: DifficultyLevel;
  subject: string;
  grade_level: string;
  reading_content: string;
  reading_visual_url?: string;
  question_text: string;
  correct_answer: string;
  answer_options?: Record<string, string>;
  explanation?: string;
  tags: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ProblemReadingStage {
  id: string;
  title: string;
  problem_type: ProblemType;
  difficulty_level: DifficultyLevel;
  subject: string;
  grade_level: string;
  reading_content: string;
  reading_visual_url?: string;
  tags: string[];
}

export interface ProblemSolvingStage {
  id: string;
  title: string;
  problem_type: ProblemType;
  question_text: string;
  answer_options?: Record<string, string>;
}

// Progress types
export enum StageType {
  READING = "reading",
  SOLVING = "solving",
  COMPLETED = "completed",
}

export interface StudentProgress {
  id: string;
  student_id: string;
  problem_id: string;
  current_stage: StageType;
  reading_completed: boolean;
  solving_completed: boolean;
  reading_started_at?: string;
  reading_completed_at?: string;
  solving_started_at?: string;
  solving_completed_at?: string;
  reading_duration_seconds: number;
  solving_duration_seconds: number;
  reading_confirmed: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentAttempt {
  id: string;
  student_id: string;
  problem_id: string;
  progress_id: string;
  attempt_number: number;
  submitted_answer: string;
  is_correct: boolean;
  time_spent_seconds?: number;
  attempted_at: string;
}

export interface SubmitAnswerResponse {
  attempt: StudentAttempt;
  is_correct: boolean;
  correct_answer: string;
  explanation?: string;
  attempt_number: number;
  total_attempts: number;
}
