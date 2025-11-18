/**
 * API Service for vector transformation problems
 */
import axios from 'axios';
import { VectorProblem, StudentAttempt, StudentAttemptResponse } from '../types/vector';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const vectorAPI = {
  /**
   * Get all vector problems
   */
  getProblems: async (filters?: {
    module_id?: string;
    problem_type?: string;
    difficulty?: number;
  }): Promise<VectorProblem[]> => {
    const response = await api.get('/api/vector-problems/', { params: filters });
    return response.data;
  },

  /**
   * Get a specific problem by ID
   */
  getProblem: async (problemId: string): Promise<VectorProblem> => {
    const response = await api.get(`/api/vector-problems/${problemId}`);
    return response.data;
  },

  /**
   * Get a random problem by difficulty level
   */
  getRandomProblem: async (difficultyLevel: number): Promise<VectorProblem> => {
    const response = await api.get(`/api/vector-problems/random/${difficultyLevel}`);
    return response.data;
  },

  /**
   * Submit a student attempt
   */
  submitAttempt: async (attempt: StudentAttempt): Promise<StudentAttemptResponse> => {
    const response = await api.post('/api/vector-problems/attempts', attempt);
    return response.data;
  },

  /**
   * Get all modules
   */
  getModules: async () => {
    const response = await api.get('/api/vector-problems/modules');
    return response.data;
  },
};

export default api;
