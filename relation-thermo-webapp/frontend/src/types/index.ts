export type RelationType = 'SUBSET' | 'SUPERSET' | 'EQUAL' | 'DISJOINT' | 'INTERSECT';

export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

export interface Problem {
  id: number;
  title: string;
  description?: string;
  setA: number[];
  setB: number[];
  difficulty: number;
  createdAt: string;
}

export interface Response {
  id: number;
  userId: number;
  problemId: number;
  selectedRelation: RelationType;
  confidenceLevel: number;
  isCorrect: boolean;
  timeSpent: number;
  submittedAt: string;
  problem?: {
    title: string;
    difficulty: number;
  };
}

export interface Progress {
  totalProblems: number;
  correctAnswers: number;
  accuracy: number;
  averageConfidence: number;
  totalTimeSpent: number;
  lastActivityAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface SubmitResponseRequest {
  problemId: number;
  selectedRelation: RelationType;
  confidenceLevel: number;
  timeSpent: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
