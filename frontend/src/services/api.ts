import axios from 'axios';
import type {
  User,
  UserLogin,
  UserRegister,
  Token,
  Problem,
  ProblemReadingStage,
  ProblemSolvingStage,
  StudentProgress,
  SubmitAnswerResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: async (credentials: UserLogin): Promise<Token> => {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await api.post<Token>('/api/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  register: async (userData: UserRegister): Promise<User> => {
    const response = await api.post<User>('/api/auth/register', userData);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/api/auth/me');
    return response.data;
  },
};

// Problems API
export const problemsAPI = {
  getProblems: async (params?: {
    subject?: string;
    grade_level?: string;
    difficulty?: string;
  }): Promise<Problem[]> => {
    const response = await api.get<Problem[]>('/api/problems/', { params });
    return response.data;
  },

  getProblem: async (problemId: string): Promise<Problem> => {
    const response = await api.get<Problem>(`/api/problems/${problemId}`);
    return response.data;
  },

  getProblemReadingStage: async (problemId: string): Promise<ProblemReadingStage> => {
    const response = await api.get<ProblemReadingStage>(`/api/problems/${problemId}/reading`);
    return response.data;
  },

  getProblemSolvingStage: async (problemId: string): Promise<ProblemSolvingStage> => {
    const response = await api.get<ProblemSolvingStage>(`/api/problems/${problemId}/solving`);
    return response.data;
  },

  createProblem: async (problemData: Partial<Problem>): Promise<Problem> => {
    const response = await api.post<Problem>('/api/problems/', problemData);
    return response.data;
  },
};

// Progress API
export const progressAPI = {
  startProblem: async (problemId: string): Promise<StudentProgress> => {
    const response = await api.post<StudentProgress>(`/api/progress/${problemId}/start`);
    return response.data;
  },

  confirmReading: async (
    problemId: string,
    readingDurationSeconds: number
  ): Promise<StudentProgress> => {
    const response = await api.post<StudentProgress>(
      `/api/progress/${problemId}/confirm-reading`,
      { reading_duration_seconds: readingDurationSeconds }
    );
    return response.data;
  },

  startSolving: async (problemId: string): Promise<StudentProgress> => {
    const response = await api.post<StudentProgress>(
      `/api/progress/${problemId}/start-solving`,
      {}
    );
    return response.data;
  },

  submitAnswer: async (
    problemId: string,
    submittedAnswer: string,
    timeSpentSeconds?: number
  ): Promise<SubmitAnswerResponse> => {
    const response = await api.post<SubmitAnswerResponse>(
      `/api/progress/${problemId}/submit-answer`,
      {
        submitted_answer: submittedAnswer,
        time_spent_seconds: timeSpentSeconds,
      }
    );
    return response.data;
  },

  getProgress: async (problemId: string): Promise<StudentProgress> => {
    const response = await api.get<StudentProgress>(`/api/progress/${problemId}`);
    return response.data;
  },

  getAllProgress: async (): Promise<StudentProgress[]> => {
    const response = await api.get<StudentProgress[]>('/api/progress/');
    return response.data;
  },
};

export default api;
