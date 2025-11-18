/**
 * API service for communicating with the backend
 */
import axios from 'axios';
import type {
  LearningSession,
  ActivityEvent,
  ThinkingFlowGraphData,
  StudentProgress,
  EventType,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const sessionAPI = {
  /**
   * Create a new learning session
   */
  createSession: async (
    studentId: string,
    moduleId: string,
    problemId: string
  ): Promise<LearningSession> => {
    const response = await apiClient.post('/api/sessions/', {
      student_id: studentId,
      module_id: moduleId,
      problem_id: problemId,
    });
    return response.data;
  },

  /**
   * Get session details
   */
  getSession: async (sessionId: string): Promise<LearningSession> => {
    const response = await apiClient.get(`/api/sessions/${sessionId}`);
    return response.data;
  },

  /**
   * Update session (e.g., mark as completed)
   */
  updateSession: async (
    sessionId: string,
    updates: Partial<LearningSession>
  ): Promise<LearningSession> => {
    const response = await apiClient.patch(`/api/sessions/${sessionId}`, updates);
    return response.data;
  },

  /**
   * Track an activity event
   */
  trackEvent: async (
    sessionId: string,
    eventType: EventType,
    timeSinceStartMs: number,
    eventData?: Record<string, any>
  ): Promise<ActivityEvent> => {
    const response = await apiClient.post('/api/sessions/events', {
      session_id: sessionId,
      event_type: eventType,
      time_since_start_ms: timeSinceStartMs,
      event_data: eventData,
    });
    return response.data;
  },

  /**
   * Get all events for a session
   */
  getSessionEvents: async (sessionId: string): Promise<ActivityEvent[]> => {
    const response = await apiClient.get(`/api/sessions/${sessionId}/events`);
    return response.data;
  },

  /**
   * Analyze session and get thinking flow graph data
   */
  analyzeSession: async (sessionId: string): Promise<ThinkingFlowGraphData> => {
    const response = await apiClient.post(`/api/sessions/${sessionId}/analyze`);
    return response.data;
  },

  /**
   * Get student progress summary
   */
  getStudentProgress: async (
    studentId: string,
    moduleId?: string
  ): Promise<StudentProgress> => {
    const params = moduleId ? { module_id: moduleId } : {};
    const response = await apiClient.get(`/api/sessions/student/${studentId}/progress`, {
      params,
    });
    return response.data;
  },
};

export default apiClient;
