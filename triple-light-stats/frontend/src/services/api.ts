import axios from 'axios';
import type { Quiz, QuizStats, ApiResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const apiService = {
  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await api.get('/api/health');
      return response.data.success;
    } catch (error) {
      return false;
    }
  },

  /**
   * Get list of quizzes
   */
  async getQuizzes(): Promise<Quiz[]> {
    const response = await api.get<ApiResponse<Quiz[]>>('/api/quizzes');
    return response.data.data || [];
  },

  /**
   * Get statistics for a specific quiz
   */
  async getQuizStats(quizId: number): Promise<QuizStats> {
    const response = await api.get<ApiResponse<QuizStats>>(`/api/stats/${quizId}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch statistics');
    }
    return response.data.data;
  },
};

export default apiService;
