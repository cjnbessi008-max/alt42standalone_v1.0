import axios from 'axios';
import type { ProblemData, StudentProgress } from '../types';

const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Get problem from Moodle
  getProblem: async (problemId?: number): Promise<ProblemData> => {
    const url = problemId ? `/problems/${problemId}` : '/problems/random';
    const response = await apiClient.get<ProblemData>(url);
    return response.data;
  },

  // Submit student progress
  submitProgress: async (progress: StudentProgress): Promise<void> => {
    await apiClient.post('/progress', progress);
  },

  // Get student progress
  getProgress: async (studentId: number): Promise<StudentProgress[]> => {
    const response = await apiClient.get<StudentProgress[]>(`/progress/${studentId}`);
    return response.data;
  },

  // Health check
  healthCheck: async (): Promise<{ status: string }> => {
    const response = await apiClient.get('/health');
    return response.data;
  },
};
