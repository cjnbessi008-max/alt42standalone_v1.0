import axios from 'axios';
import { PlaceStairProblem, PlaceValues, ValidationResult } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const problemApi = {
  /**
   * Generate new problems
   */
  generateProblems: async (config: {
    minValue?: number;
    maxValue?: number;
    difficulty?: number;
    count?: number;
  }): Promise<PlaceStairProblem[]> => {
    const response = await api.get('/problems/generate', { params: config });
    return response.data.data;
  },

  /**
   * Get problems from Moodle
   */
  getMoodleProblems: async (studentId: number, courseId: number): Promise<PlaceStairProblem[]> => {
    const response = await api.get(`/problems/moodle/${studentId}/${courseId}`);
    return response.data.data;
  },

  /**
   * Validate answer
   */
  validateAnswer: async (problem: PlaceStairProblem, answer: PlaceValues): Promise<ValidationResult> => {
    const response = await api.post('/problems/validate', { problem, answer });
    return response.data.data;
  },

  /**
   * Submit answer to Moodle
   */
  submitAnswer: async (
    studentId: number,
    problemId: number,
    answer: PlaceValues,
    isCorrect: boolean,
    timeSpent: number
  ): Promise<any> => {
    const response = await api.post('/problems/submit', {
      studentId,
      problemId,
      answer,
      isCorrect,
      timeSpent
    });
    return response.data;
  },

  /**
   * Get student progress
   */
  getProgress: async (studentId: number, courseId: number): Promise<any> => {
    const response = await api.get(`/problems/progress/${studentId}/${courseId}`);
    return response.data.data;
  }
};

export default api;
