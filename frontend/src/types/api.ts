import { Problem, StudentProgress } from './math';

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Problem list response from Moodle
 */
export interface ProblemsResponse {
  problems: Problem[];
  total: number;
  page: number;
  perPage: number;
}

/**
 * Progress update request
 */
export interface ProgressUpdateRequest {
  problemId: number;
  studentId: number;
  currentStep: number;
  completed: boolean;
  timeSpent: number;
}

/**
 * Moodle user info
 */
export interface MoodleUser {
  id: number;
  username: string;
  fullname: string;
  email: string;
}
