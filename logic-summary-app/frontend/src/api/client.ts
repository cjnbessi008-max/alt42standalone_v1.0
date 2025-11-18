import axios from 'axios';
import { Problem, ProblemCreate, LogicSummaryResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const problemsApi = {
  // Create a new problem
  create: async (problem: ProblemCreate): Promise<Problem> => {
    const response = await apiClient.post<Problem>('/api/problems/', problem);
    return response.data;
  },

  // Get all problems
  list: async (): Promise<Problem[]> => {
    const response = await apiClient.get<Problem[]>('/api/problems/');
    return response.data;
  },

  // Get a specific problem
  get: async (id: number): Promise<Problem> => {
    const response = await apiClient.get<Problem>(`/api/problems/${id}`);
    return response.data;
  },

  // Delete a problem
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/problems/${id}`);
  },

  // Analyze a problem to generate logic summary
  analyze: async (id: number): Promise<LogicSummaryResponse> => {
    const response = await apiClient.post<LogicSummaryResponse>(
      `/api/problems/${id}/analyze`
    );
    return response.data;
  },
};

export default apiClient;
