import axios from 'axios';
import type { InverseProblem, StudentAttempt } from '../types/problem';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Problems API
export const problemsApi = {
  getAll: async (params?: {
    module_id?: string;
    difficulty?: string;
    function_type?: string;
    limit?: number;
    offset?: number;
  }) => {
    const response = await api.get<InverseProblem[]>('/problems', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<InverseProblem>(`/problems/${id}`);
    return response.data;
  },

  generate: async (data: {
    original_function: string;
    function_type: string;
    difficulty_level: string;
    module_id?: string;
  }) => {
    const response = await api.post<InverseProblem>('/problems/generate', data);
    return response.data;
  },

  batchGenerate: async (data: {
    function_types: string[];
    difficulty_level: string;
    count: number;
    module_id?: string;
  }) => {
    const response = await api.post('/problems/batch-generate', data);
    return response.data;
  },
};

// Attempts API
export const attemptsApi = {
  submit: async (data: {
    problem_id: string;
    student_id: string;
    attempted_inverse: string;
    is_correct: boolean;
    interaction_log: any[];
    time_spent_seconds: number;
  }) => {
    const response = await api.post<StudentAttempt>('/attempts', data);
    return response.data;
  },

  getByStudent: async (studentId: string) => {
    const response = await api.get<StudentAttempt[]>(`/attempts/student/${studentId}`);
    return response.data;
  },
};

// Modules API
export const modulesApi = {
  getAll: async () => {
    const response = await api.get('/modules');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/modules/${id}`);
    return response.data;
  },
};

export default api;
