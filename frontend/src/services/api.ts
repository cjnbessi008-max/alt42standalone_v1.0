/**
 * API service for communicating with backend
 */
import axios from 'axios';
import type {
  QuestionSuggestionRequest,
  QuestionSuggestionResponse,
  QuestionFeedbackRequest,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const questionSuggestionApi = {
  /**
   * Generate question suggestions for a student
   */
  async generateSuggestions(
    request: QuestionSuggestionRequest
  ): Promise<QuestionSuggestionResponse> {
    const response = await api.post<QuestionSuggestionResponse>(
      '/question-suggestions/generate',
      request
    );
    return response.data;
  },

  /**
   * Submit feedback on suggestions
   */
  async submitFeedback(
    feedback: QuestionFeedbackRequest
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/question-suggestions/feedback', feedback);
    return response.data;
  },

  /**
   * Get suggestion history for a student
   */
  async getSuggestionHistory(
    studentId: string,
    limit: number = 10
  ): Promise<any[]> {
    const response = await api.get(
      `/question-suggestions/history/${studentId}`,
      { params: { limit } }
    );
    return response.data;
  },
};

export default api;
