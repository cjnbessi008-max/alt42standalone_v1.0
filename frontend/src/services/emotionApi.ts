/**
 * API client for emotion detection endpoints
 */
import axios from 'axios';
import {
  BehaviorEvent,
  EmotionState,
  EmotionDashboard,
  EmotionPattern,
  LMSConfig,
} from '../types/emotion';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('[API Response Error]', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const emotionApi = {
  /**
   * Track a behavior event
   */
  trackBehaviorEvent: async (event: BehaviorEvent): Promise<void> => {
    try {
      await apiClient.post('/api/emotions/behavior-events', event);
    } catch (error) {
      console.error('Failed to track behavior event:', error);
      // Don't throw - tracking failures shouldn't break the app
    }
  },

  /**
   * Analyze emotions for a session
   */
  analyzeEmotions: async (
    sessionId: string,
    studentId: string,
    windowMinutes: number = 5
  ): Promise<EmotionState> => {
    const response = await apiClient.post<EmotionState>('/api/emotions/analyze', {
      session_id: sessionId,
      student_id: studentId,
      window_minutes: windowMinutes,
    });
    return response.data;
  },

  /**
   * Get emotion dashboard data
   */
  getEmotionDashboard: async (
    sessionId: string,
    studentId: string
  ): Promise<EmotionDashboard> => {
    const response = await apiClient.get<EmotionDashboard>(
      `/api/emotions/dashboard/${sessionId}`,
      {
        params: { student_id: studentId },
      }
    );
    return response.data;
  },

  /**
   * Get emotion patterns for a student
   */
  getEmotionPatterns: async (
    studentId: string,
    days: number = 7
  ): Promise<EmotionPattern[]> => {
    const response = await apiClient.get<EmotionPattern[]>(
      `/api/emotions/patterns/${studentId}`,
      {
        params: { days },
      }
    );
    return response.data;
  },

  /**
   * Configure LMS integration
   */
  configureLMS: async (config: LMSConfig): Promise<void> => {
    await apiClient.post('/api/emotions/lms/configure', config);
  },

  /**
   * Health check
   */
  healthCheck: async (): Promise<{ status: string }> => {
    const response = await apiClient.get('/api/emotions/health');
    return response.data;
  },
};
