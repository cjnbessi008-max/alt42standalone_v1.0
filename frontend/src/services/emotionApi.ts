/**
 * Emotion Refresh Routine - API Service
 * =====================================
 * API client for emotion tracking and refresh routines
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  EmotionCheckInRequest,
  EmotionCheckInResponse,
  GenerateActivityRequest,
  GenerateActivityResponse,
  CompleteSessionRequest,
  CompleteSessionResponse,
  StudentEmotionHistoryResponse,
  EmotionAnalyticsResponse,
  ErrorResponse,
} from '../types/emotion';

// API configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
const API_TIMEOUT = 30000; // 30 seconds

/**
 * Emotion API Client
 */
class EmotionApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = API_BASE_URL) {
    this.client = axios.create({
      baseURL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor (for auth tokens, etc.)
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor (for error handling)
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ErrorResponse>) => {
        if (error.response) {
          // Server responded with error
          const errorData = error.response.data;
          throw new Error(errorData.error || 'An error occurred');
        } else if (error.request) {
          // Request made but no response
          throw new Error('Network error: No response from server');
        } else {
          // Error setting up request
          throw new Error(error.message || 'Unknown error occurred');
        }
      }
    );
  }

  /**
   * Create emotion check-in
   */
  async createCheckIn(
    request: EmotionCheckInRequest
  ): Promise<EmotionCheckInResponse> {
    const response = await this.client.post<EmotionCheckInResponse>(
      '/api/emotions/check-in',
      request
    );
    return response.data;
  }

  /**
   * Get student emotion history
   */
  async getStudentHistory(
    studentId: string,
    days: number = 7
  ): Promise<StudentEmotionHistoryResponse> {
    const response = await this.client.get<StudentEmotionHistoryResponse>(
      `/api/emotions/student/${studentId}`,
      {
        params: { days },
      }
    );
    return response.data;
  }

  /**
   * Get module analytics (teacher dashboard)
   */
  async getModuleAnalytics(
    moduleId: string,
    date?: string
  ): Promise<EmotionAnalyticsResponse> {
    const response = await this.client.get<EmotionAnalyticsResponse>(
      `/api/emotions/analytics/${moduleId}`,
      {
        params: { date },
      }
    );
    return response.data;
  }

  /**
   * Generate refresh activity
   */
  async generateActivity(
    request: GenerateActivityRequest
  ): Promise<GenerateActivityResponse> {
    const response = await this.client.post<GenerateActivityResponse>(
      '/api/refresh/generate',
      request
    );
    return response.data;
  }

  /**
   * Complete refresh session
   */
  async completeSession(
    request: CompleteSessionRequest
  ): Promise<CompleteSessionResponse> {
    const response = await this.client.post<CompleteSessionResponse>(
      '/api/refresh/complete',
      request
    );
    return response.data;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.client.get('/api/health');
    return response.data;
  }
}

// Export singleton instance
export const emotionApi = new EmotionApiClient();

// Export class for testing
export default EmotionApiClient;
