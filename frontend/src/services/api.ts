/**
 * API client for LMS Hint System
 */
import axios from 'axios';
import type { HintRequest, HintResponse, StudentProgress } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens if needed
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const hintService = {
  /**
   * Generate a hint for a problem
   */
  generateHint: async (request: HintRequest): Promise<HintResponse> => {
    const response = await apiClient.post<HintResponse>('/api/hints/generate', request);
    return response.data;
  },

  /**
   * Validate a hint
   */
  validateHint: async (hintText: string, problemAnswer?: string) => {
    const response = await apiClient.post('/api/hints/validate', {
      hint_text: hintText,
      problem_answer: problemAnswer,
    });
    return response.data;
  },

  /**
   * Health check
   */
  healthCheck: async () => {
    const response = await apiClient.get('/api/hints/health');
    return response.data;
  },
};

export const lmsService = {
  /**
   * Get student progress
   */
  getStudentProgress: async (studentId: string): Promise<StudentProgress> => {
    const response = await apiClient.get<StudentProgress>(
      `/api/lms/student/${studentId}/progress`
    );
    return response.data;
  },

  /**
   * Submit grade to LMS
   */
  submitGrade: async (
    studentId: string,
    assignmentId: string,
    score: number,
    maxScore: number = 100,
    comment?: string
  ) => {
    const response = await apiClient.post('/api/lms/grade/submit', {
      student_id: studentId,
      assignment_id: assignmentId,
      score,
      max_score: maxScore,
      comment,
    });
    return response.data;
  },
};

export default apiClient;
