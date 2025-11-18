import axios, { AxiosInstance } from 'axios';
import { ApiResponse, QuizProblem, TrapPoint } from '../types';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get quiz with all problems and trap points
   */
  async getQuiz(quizId: number): Promise<QuizProblem[]> {
    try {
      const response = await this.client.get<
        ApiResponse<{ problems: QuizProblem[] }>
      >(`/quiz/${quizId}`);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to fetch quiz');
      }

      return response.data.data.problems;
    } catch (error) {
      console.error('Error fetching quiz:', error);
      throw error;
    }
  }

  /**
   * Get single problem with trap points
   */
  async getProblem(problemId: number): Promise<QuizProblem> {
    try {
      const response = await this.client.get<ApiResponse<QuizProblem>>(
        `/problem/${problemId}`
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to fetch problem');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error fetching problem:', error);
      throw error;
    }
  }

  /**
   * Get trap points for a question
   */
  async getTrapPoints(questionId: number): Promise<TrapPoint[]> {
    try {
      const response = await this.client.get<ApiResponse<TrapPoint[]>>(
        `/trap-points/${questionId}`
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to fetch trap points');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error fetching trap points:', error);
      throw error;
    }
  }

  /**
   * Create or update trap point
   */
  async saveTrapPoint(trapPoint: Omit<TrapPoint, 'id'>): Promise<number> {
    try {
      const response = await this.client.post<ApiResponse<{ id: number }>>(
        '/trap-points',
        trapPoint
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to save trap point');
      }

      return response.data.data.id;
    } catch (error) {
      console.error('Error saving trap point:', error);
      throw error;
    }
  }

  /**
   * Delete trap point
   */
  async deleteTrapPoint(trapPointId: number): Promise<boolean> {
    try {
      const response = await this.client.delete<ApiResponse<{ deleted: boolean }>>(
        `/trap-points/${trapPointId}`
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to delete trap point');
      }

      return response.data.data.deleted;
    } catch (error) {
      console.error('Error deleting trap point:', error);
      throw error;
    }
  }
}

export default new ApiService();
