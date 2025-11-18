import axios from 'axios';
import type {
  Problem,
  ProblemWithHints,
  StudentProgress,
  SubmitAttemptRequest,
  SubmitAttemptResponse,
  ApiResponse,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const problemsAPI = {
  getAll: async (filters?: {
    difficulty?: number;
    category?: string;
    active?: boolean;
  }): Promise<Problem[]> => {
    const params = new URLSearchParams();
    if (filters?.difficulty) params.append('difficulty', filters.difficulty.toString());
    if (filters?.category) params.append('category', filters.category);
    if (filters?.active !== undefined) params.append('active', filters.active.toString());

    const response = await api.get<ApiResponse<Problem[]>>(`/problems?${params}`);
    return response.data.data || [];
  },

  getById: async (id: number): Promise<Problem | null> => {
    const response = await api.get<ApiResponse<Problem>>(`/problems/${id}`);
    return response.data.data || null;
  },

  getWithHints: async (id: number): Promise<ProblemWithHints | null> => {
    const response = await api.get<ApiResponse<ProblemWithHints>>(`/problems/${id}/hints`);
    return response.data.data || null;
  },

  getByDifficulty: async (level: number): Promise<Problem[]> => {
    const response = await api.get<ApiResponse<Problem[]>>(`/problems/difficulty/${level}`);
    return response.data.data || [];
  },

  create: async (problemData: Partial<Problem>): Promise<number> => {
    const response = await api.post<ApiResponse<{ id: number }>>('/problems', problemData);
    return response.data.data?.id || 0;
  },
};

export const progressAPI = {
  getByStudent: async (studentId: number): Promise<StudentProgress[]> => {
    const response = await api.get<ApiResponse<StudentProgress[]>>(`/progress/${studentId}`);
    return response.data.data || [];
  },

  getStats: async (studentId: number) => {
    const response = await api.get<ApiResponse<any>>(`/progress/${studentId}/stats`);
    return response.data.data || null;
  },

  startProblem: async (studentId: number, problemId: number): Promise<number> => {
    const response = await api.post<ApiResponse<{ id: number }>>('/progress', {
      student_id: studentId,
      problem_id: problemId,
    });
    return response.data.data?.id || 0;
  },

  submitAttempt: async (data: SubmitAttemptRequest): Promise<SubmitAttemptResponse> => {
    const response = await api.post<ApiResponse<SubmitAttemptResponse>>('/progress/submit', data);
    if (!response.data.data) {
      throw new Error(response.data.error || 'Failed to submit attempt');
    }
    return response.data.data;
  },

  getAttempts: async (studentId: number, problemId: number) => {
    const response = await api.get<ApiResponse<any>>(`/progress/${studentId}/${problemId}/attempts`);
    return response.data.data || [];
  },
};

export default api;
