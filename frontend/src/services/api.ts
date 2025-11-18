import axios from 'axios';
import {
  Problem,
  SubmitAnswerResponse,
  Fraction,
  StudentProgress,
  ErrorPattern,
  PerformanceSummary,
  DifficultyLevel,
  ProblemType,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Problem API
export const problemApi = {
  getAll: async (filters?: {
    type?: ProblemType;
    difficulty?: DifficultyLevel;
    limit?: number;
  }): Promise<Problem[]> => {
    const response = await api.get('/problems', { params: filters });
    return response.data.data;
  },

  getById: async (id: string): Promise<Problem> => {
    const response = await api.get(`/problems/${id}`);
    return response.data.data;
  },

  getRandom: async (type?: ProblemType, difficulty?: DifficultyLevel): Promise<Problem> => {
    const response = await api.get('/problems/random', {
      params: { type, difficulty },
    });
    return response.data.data;
  },

  submitAnswer: async (
    problemId: string,
    studentAnswer: Fraction,
    timeSpent?: number,
    studentId?: string
  ): Promise<SubmitAnswerResponse> => {
    const response = await api.post(`/problems/${problemId}/submit`, {
      student_answer: studentAnswer,
      time_spent_seconds: timeSpent,
      student_id: studentId,
    });
    return response.data.data;
  },
};

// Student API
export const studentApi = {
  getProgress: async (studentId: string): Promise<StudentProgress[]> => {
    const response = await api.get(`/students/${studentId}/progress`);
    return response.data.data;
  },

  getErrorPatterns: async (studentId: string): Promise<ErrorPattern[]> => {
    const response = await api.get(`/students/${studentId}/errors`);
    return response.data.data;
  },

  getErrorStats: async (
    studentId: string
  ): Promise<Array<{ error_type: string; count: number; percentage: number }>> => {
    const response = await api.get(`/students/${studentId}/error-stats`);
    return response.data.data;
  },

  getPerformanceSummary: async (studentId: string): Promise<PerformanceSummary> => {
    const response = await api.get(`/students/${studentId}/summary`);
    return response.data.data;
  },
};

// Health check
export const healthCheck = async (): Promise<{ status: string; timestamp: string }> => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
