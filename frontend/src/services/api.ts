/**
 * API Service for LMS Integration and Confusion Tracking
 *
 * Handles all HTTP requests to the backend API for confusion level tracking
 * and LMS integration.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  StudentConfusionState,
  BehaviorMetrics,
  ConceptConfusion,
  ClassroomConfusion,
  LMSIntegrationData,
  ConfusionEvent,
} from '../types/confusion';

/**
 * API configuration
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_TIMEOUT = 10000; // 10 seconds

/**
 * Create axios instance with default config
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - Add auth token
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle errors
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * API endpoints
 */
export const confusionAPI = {
  /**
   * Submit behavior metrics for confusion tracking
   */
  submitBehaviorMetrics: async (
    studentId: string,
    conceptId: string,
    metrics: BehaviorMetrics
  ): Promise<StudentConfusionState> => {
    const response = await apiClient.post('/confusion/metrics', {
      studentId,
      conceptId,
      metrics,
    });
    return response.data;
  },

  /**
   * Get current student confusion state
   */
  getStudentConfusion: async (studentId: string, moduleId: string): Promise<StudentConfusionState> => {
    const response = await apiClient.get(`/confusion/student/${studentId}`, {
      params: { moduleId },
    });
    return response.data;
  },

  /**
   * Get confusion for specific concept
   */
  getConceptConfusion: async (studentId: string, conceptId: string): Promise<ConceptConfusion> => {
    const response = await apiClient.get(`/confusion/concept/${conceptId}`, {
      params: { studentId },
    });
    return response.data;
  },

  /**
   * Get classroom-wide confusion analytics
   */
  getClassroomConfusion: async (classId: string, moduleId: string): Promise<ClassroomConfusion> => {
    const response = await apiClient.get(`/confusion/classroom/${classId}`, {
      params: { moduleId },
    });
    return response.data;
  },

  /**
   * Get confusion history for student
   */
  getConfusionHistory: async (
    studentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<StudentConfusionState[]> => {
    const response = await apiClient.get(`/confusion/history/${studentId}`, {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
    return response.data;
  },

  /**
   * Subscribe to real-time confusion events (WebSocket)
   */
  subscribeToConfusionEvents: (
    studentId: string,
    onEvent: (event: ConfusionEvent) => void
  ): WebSocket => {
    const wsUrl = API_BASE_URL.replace('http', 'ws').replace('/api', '');
    const ws = new WebSocket(`${wsUrl}/ws/confusion/${studentId}`);

    ws.onmessage = (event) => {
      const confusionEvent: ConfusionEvent = JSON.parse(event.data);
      onEvent(confusionEvent);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return ws;
  },
};

/**
 * LMS Integration API endpoints
 */
export const lmsAPI = {
  /**
   * Initialize LMS session
   */
  initializeLMSSession: async (lmsData: LMSIntegrationData): Promise<{ sessionId: string }> => {
    const response = await apiClient.post('/lms/initialize', lmsData);
    return response.data;
  },

  /**
   * Sync student data from LMS
   */
  syncStudentData: async (courseId: string): Promise<{ synced: number }> => {
    const response = await apiClient.post('/lms/sync', { courseId });
    return response.data;
  },

  /**
   * Send grade/progress back to LMS
   */
  sendProgressToLMS: async (
    studentId: string,
    activityId: string,
    score: number,
    completed: boolean
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.post('/lms/progress', {
      studentId,
      activityId,
      score,
      completed,
    });
    return response.data;
  },

  /**
   * Get LMS course structure
   */
  getCourseStructure: async (courseId: string): Promise<unknown> => {
    const response = await apiClient.get(`/lms/course/${courseId}`);
    return response.data;
  },
};

/**
 * Module/Content API endpoints
 */
export const moduleAPI = {
  /**
   * Get available modules
   */
  getModules: async (studentId: string): Promise<unknown[]> => {
    const response = await apiClient.get('/modules', {
      params: { studentId },
    });
    return response.data;
  },

  /**
   * Get module details
   */
  getModuleDetails: async (moduleId: string): Promise<unknown> => {
    const response = await apiClient.get(`/modules/${moduleId}`);
    return response.data;
  },

  /**
   * Submit problem answer
   */
  submitAnswer: async (
    moduleId: string,
    problemId: string,
    answer: unknown
  ): Promise<{ correct: boolean; feedback: string }> => {
    const response = await apiClient.post(`/modules/${moduleId}/submit`, {
      problemId,
      answer,
    });
    return response.data;
  },
};

/**
 * Export API client for custom requests
 */
export { apiClient };

/**
 * Export all APIs
 */
export default {
  confusion: confusionAPI,
  lms: lmsAPI,
  module: moduleAPI,
};
