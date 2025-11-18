import axios from 'axios';
import type { MoodleQuestion } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class MoodleService {
  private apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  /**
   * Fetch a question from Moodle by question ID
   */
  async getQuestion(questionId: number): Promise<MoodleQuestion> {
    try {
      const response = await this.apiClient.get(`/questions/${questionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching question:', error);
      throw new Error('Failed to fetch question from Moodle');
    }
  }

  /**
   * Submit an answer to Moodle
   */
  async submitAnswer(questionId: number, answer: number): Promise<{ correct: boolean; feedback: string }> {
    try {
      const response = await this.apiClient.post(`/questions/${questionId}/submit`, {
        answer,
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting answer:', error);
      throw new Error('Failed to submit answer to Moodle');
    }
  }

  /**
   * Get random question from a specific category
   */
  async getRandomQuestion(categoryId?: number): Promise<MoodleQuestion> {
    try {
      const url = categoryId
        ? `/questions/random?categoryId=${categoryId}`
        : '/questions/random';
      const response = await this.apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching random question:', error);
      throw new Error('Failed to fetch random question');
    }
  }
}

export const moodleService = new MoodleService();
