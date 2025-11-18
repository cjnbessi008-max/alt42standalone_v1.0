/**
 * API service for communicating with backend
 */

import axios, { AxiosInstance } from 'axios';
import type { Problem, StudentProgress, ApiResponse } from '../types';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get a random problem
   */
  async getProblem(difficulty?: 'easy' | 'medium' | 'hard'): Promise<Problem> {
    const response = await this.client.get<ApiResponse<Problem>>('/problems/random', {
      params: { difficulty },
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch problem');
    }

    return response.data.data;
  }

  /**
   * Get a specific problem by ID
   */
  async getProblemById(id: string): Promise<Problem> {
    const response = await this.client.get<ApiResponse<Problem>>(`/problems/${id}`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch problem');
    }

    return response.data.data;
  }

  /**
   * Submit student progress
   */
  async submitProgress(progress: Omit<StudentProgress, 'completedAt'>): Promise<void> {
    const response = await this.client.post<ApiResponse<void>>('/progress', {
      ...progress,
      completedAt: new Date(),
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to submit progress');
    }
  }

  /**
   * Get problems from Moodle
   */
  async getMoodleProblems(courseId: string): Promise<Problem[]> {
    const response = await this.client.get<ApiResponse<Problem[]>>('/moodle/problems', {
      params: { courseId },
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch Moodle problems');
    }

    return response.data.data;
  }

  /**
   * Sync progress to Moodle
   */
  async syncToMoodle(progress: StudentProgress): Promise<void> {
    const response = await this.client.post<ApiResponse<void>>('/moodle/sync', progress);

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to sync to Moodle');
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get<ApiResponse<{ status: string }>>('/health');
      return response.data.success && response.data.data?.status === 'ok';
    } catch {
      return false;
    }
  }
}

export const apiService = new ApiService();
export default apiService;
