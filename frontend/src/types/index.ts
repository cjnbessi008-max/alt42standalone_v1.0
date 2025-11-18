export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin',
}

export enum ProblemType {
  MATH = 'math',
  CODING = 'coding',
  ESSAY = 'essay',
}

export enum ProblemDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export interface User {
  id: string
  email: string
  username: string
  full_name?: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface Problem {
  id: string
  title: string
  description: string
  problem_type: ProblemType
  difficulty: ProblemDifficulty
  author_id: string
  max_score: number
  time_limit_minutes?: number
  created_at: string
  updated_at: string
}

export interface Solution {
  id: string
  problem_id: string
  student_id?: string
  content: string
  explanation?: string
  is_model_solution: boolean
  score?: number
  submitted_at: string
}

export interface Comparison {
  id: string
  student_solution_id: string
  model_solution_id: string
  similarity_score?: number
  feedback?: string
  strengths?: string[]
  improvements?: string[]
  differences?: {
    approach?: string
    accuracy?: string
    completeness?: string
  }
  created_at: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
  full_name?: string
  role: UserRole
}

export interface Token {
  access_token: string
  token_type: string
}

export interface ProblemCreateRequest {
  title: string
  description: string
  problem_type: ProblemType
  difficulty: ProblemDifficulty
  max_score: number
  time_limit_minutes?: number
  model_solution_content?: string
  model_solution_explanation?: string
}

export interface SolutionCreateRequest {
  problem_id: string
  content: string
  explanation?: string
}

export interface ComparisonRequest {
  student_solution_id: string
  model_solution_id?: string
}
