// Shared TypeScript types for adaptive learning system

export enum DifficultyLevel {
  VERY_EASY = 1,
  EASY = 2,
  MEDIUM = 3,
  HARD = 4,
  VERY_HARD = 5,
}

export enum ProblemType {
  MULTIPLE_CHOICE = 'multiple_choice',
  SHORT_ANSWER = 'short_answer',
  CODING = 'coding',
  MATH = 'math',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface Student extends User {
  role: 'student';
  currentDifficulty: DifficultyLevel;
  totalProblemsAttempted: number;
  totalCorrect: number;
  averageSolveTime: number; // in seconds
  performanceScore: number; // 0-100
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  type: ProblemType;
  difficulty: DifficultyLevel;
  timeLimit?: number; // in seconds
  correctAnswer: string;
  options?: string[]; // for multiple choice
  hints?: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Attempt {
  id: string;
  studentId: string;
  problemId: string;
  answer: string;
  isCorrect: boolean;
  timeSpent: number; // in seconds
  difficultyAtAttempt: DifficultyLevel;
  attemptedAt: Date;
}

export interface PerformanceMetrics {
  studentId: string;
  currentDifficulty: DifficultyLevel;
  recommendedDifficulty: DifficultyLevel;
  averageSolveTime: number;
  averageSolveTimeByDifficulty: Record<DifficultyLevel, number>;
  accuracyRate: number; // 0-1
  accuracyByDifficulty: Record<DifficultyLevel, number>;
  recentPerformanceTrend: 'improving' | 'stable' | 'declining';
  totalProblems: number;
  lastAttemptAt?: Date;
}

export interface DifficultyAdjustment {
  previousDifficulty: DifficultyLevel;
  newDifficulty: DifficultyLevel;
  reason: string;
  metrics: {
    recentAccuracy: number;
    averageSpeed: number;
    speedPercentile: number;
  };
  timestamp: Date;
}

export interface StudentProgress {
  studentId: string;
  student: Student;
  performanceMetrics: PerformanceMetrics;
  recentAttempts: Attempt[];
  difficultyHistory: DifficultyAdjustment[];
}

export interface TeacherDashboardData {
  totalStudents: number;
  activeStudents: number;
  averagePerformance: number;
  students: StudentProgress[];
  difficultyDistribution: Record<DifficultyLevel, number>;
}

// API Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface SubmitAnswerRequest {
  problemId: string;
  answer: string;
  timeSpent: number;
}

export interface SubmitAnswerResponse {
  isCorrect: boolean;
  correctAnswer: string;
  explanation?: string;
  newDifficulty: DifficultyLevel;
  nextProblem?: Problem;
  performanceUpdate: PerformanceMetrics;
}

export interface GetNextProblemResponse {
  problem: Problem;
  currentDifficulty: DifficultyLevel;
  studentMetrics: PerformanceMetrics;
}
