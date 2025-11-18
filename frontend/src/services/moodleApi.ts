import axios, { AxiosInstance } from 'axios';
import {
  ApiResponse,
  ProblemsResponse,
  ProgressUpdateRequest,
  MoodleUser,
} from '@/types/api';
import { Problem } from '@/types/math';

/**
 * Moodle API Service
 * Moodle LMS와 통신하기 위한 API 서비스
 */
class MoodleApiService {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || '/api';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('moodle_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get current user info from Moodle
   */
  async getCurrentUser(): Promise<ApiResponse<MoodleUser>> {
    try {
      const response = await this.client.get('/user/current');
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch user info',
      };
    }
  }

  /**
   * Get list of problems from Moodle
   */
  async getProblems(
    page: number = 1,
    perPage: number = 10,
    category?: string
  ): Promise<ApiResponse<ProblemsResponse>> {
    try {
      const response = await this.client.get('/problems', {
        params: { page, per_page: perPage, category },
      });
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch problems',
      };
    }
  }

  /**
   * Get a specific problem by ID
   */
  async getProblem(problemId: number): Promise<ApiResponse<Problem>> {
    try {
      const response = await this.client.get(`/problems/${problemId}`);
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch problem ${problemId}`,
      };
    }
  }

  /**
   * Update student progress
   */
  async updateProgress(
    data: ProgressUpdateRequest
  ): Promise<ApiResponse<void>> {
    try {
      const response = await this.client.post('/progress/update', data);
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update progress',
      };
    }
  }

  /**
   * Get student progress for a problem
   */
  async getProgress(
    problemId: number,
    studentId: number
  ): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.get('/progress', {
        params: { problem_id: problemId, student_id: studentId },
      });
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch progress',
      };
    }
  }

  /**
   * Authenticate with Moodle
   */
  async authenticate(username: string, password: string): Promise<ApiResponse<{ token: string }>> {
    try {
      const response = await this.client.post('/auth/login', {
        username,
        password,
      });

      if (response.data.success && response.data.data?.token) {
        localStorage.setItem('moodle_token', response.data.data.token);
      }

      return response.data;
    } catch (error) {
      return {
        success: false,
        error: 'Authentication failed',
      };
    }
  }

  /**
   * Logout
   */
  logout(): void {
    localStorage.removeItem('moodle_token');
  }
}

// Export singleton instance
export const moodleApi = new MoodleApiService();
