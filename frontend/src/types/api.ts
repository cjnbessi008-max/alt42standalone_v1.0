// API types and interfaces

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  institution?: string;
  createdAt: Date;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  subject: string;
  gradeLevel: string;
  teacherId: string;
  status: 'active' | 'archived' | 'draft';
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentProgress {
  studentId: string;
  moduleId: string;
  problemsCompleted: number;
  totalProblems: number;
  accuracyRate: number;
  averageTimePerProblem: number;
  lastActivityAt: Date;
}

// Moodle LTI Integration types
export interface MoodleContext {
  courseId: string;
  userId: string;
  contextId: string;
  resourceLinkId: string;
  roles: string[];
}

export interface LTILaunchRequest {
  ltiMessageType: string;
  ltiVersion: string;
  resourceLinkId: string;
  contextId: string;
  userId: string;
  roles: string[];
  lisPersonNameGiven?: string;
  lisPersonNameFamily?: string;
  lisPersonContactEmailPrimary?: string;
}

// API request/response types for Length Assist
export interface GetProblemsRequest {
  moduleId: string;
  difficulty?: number;
  limit?: number;
  offset?: number;
}

export interface SubmitAnswerRequest {
  problemId: string;
  studentId: string;
  measuredRatio: {
    line1Length: number;
    line2Length: number;
    ratio: number;
  };
  timeSpent: number;
  interactions: any[];
}

export interface SubmitAnswerResponse {
  isCorrect: boolean;
  feedback: string;
  correctRatio?: number;
  score: number;
  nextProblemId?: string;
}
