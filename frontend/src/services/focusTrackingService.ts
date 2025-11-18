/**
 * Focus Tracking API Service
 * Client-side service for interacting with focus tracking API
 */
import axios from 'axios';
import type {
  FocusSession,
  FocusBreak,
  MentalAlignmentRoutine,
  StudentFocusPreferences,
  FocusAnalytics,
  BreakCheckResponse,
  BreakReason,
  RoutineType
} from '../types/focus';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_PREFIX = '/api/v1/focus';

const api = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for authentication
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export class FocusTrackingService {
  // Focus Session Methods
  static async createSession(studentId: string, moduleId: string): Promise<FocusSession> {
    const response = await api.post('/sessions', {
      student_id: studentId,
      module_id: moduleId
    });
    return response.data;
  }

  static async getSession(sessionId: number): Promise<FocusSession> {
    const response = await api.get(`/sessions/${sessionId}`);
    return response.data;
  }

  static async updateSession(
    sessionId: number,
    data: {
      session_end?: string;
      active_duration_seconds?: number;
      idle_duration_seconds?: number;
      interaction_count?: number;
    }
  ): Promise<FocusSession> {
    const response = await api.patch(`/sessions/${sessionId}`, data);
    return response.data;
  }

  static async endSession(sessionId: number): Promise<FocusSession> {
    const response = await api.post(`/sessions/${sessionId}/end`);
    return response.data;
  }

  static async recordInteraction(sessionId: number): Promise<FocusSession> {
    const response = await api.post(`/sessions/${sessionId}/interact`);
    return response.data;
  }

  static async getActiveSession(studentId: string, moduleId: string): Promise<FocusSession | null> {
    const response = await api.get(`/sessions/student/${studentId}/active`, {
      params: { module_id: moduleId }
    });
    return response.data;
  }

  // Focus Break Methods
  static async createBreak(data: {
    session_id: number;
    student_id: string;
    break_reason: BreakReason;
    idle_duration_seconds?: number;
    routine_type?: RoutineType;
    notes?: Record<string, any>;
  }): Promise<FocusBreak> {
    const response = await api.post('/breaks', data);
    return response.data;
  }

  static async startRoutine(breakId: number): Promise<FocusBreak> {
    const response = await api.post(`/breaks/${breakId}/start`);
    return response.data;
  }

  static async completeRoutine(breakId: number, effectivenessRating?: number): Promise<FocusBreak> {
    const response = await api.post(`/breaks/${breakId}/complete`, null, {
      params: { effectiveness_rating: effectivenessRating }
    });
    return response.data;
  }

  static async skipRoutine(breakId: number): Promise<FocusBreak> {
    const response = await api.post(`/breaks/${breakId}/skip`);
    return response.data;
  }

  static async checkBreakNeeded(sessionId: number, studentId: string): Promise<BreakCheckResponse> {
    const response = await api.get(`/breaks/check/${sessionId}`, {
      params: { student_id: studentId }
    });
    return response.data;
  }

  // Mental Alignment Routine Methods
  static async getAllRoutines(): Promise<MentalAlignmentRoutine[]> {
    const response = await api.get('/routines');
    return response.data;
  }

  static async getRoutineByType(routineType: RoutineType): Promise<MentalAlignmentRoutine> {
    const response = await api.get(`/routines/${routineType}`);
    return response.data;
  }

  static async getRecommendedRoutine(studentId: string): Promise<MentalAlignmentRoutine> {
    const response = await api.get(`/routines/recommend/${studentId}`);
    return response.data;
  }

  // Student Preferences Methods
  static async createPreferences(data: {
    student_id: string;
    idle_timeout_seconds?: number;
    enable_focus_tracking?: boolean;
    enable_auto_breaks?: boolean;
    preferred_routine_type?: RoutineType;
    break_frequency_minutes?: number;
    notifications_enabled?: boolean;
    preferences?: Record<string, any>;
  }): Promise<StudentFocusPreferences> {
    const response = await api.post('/preferences', data);
    return response.data;
  }

  static async getPreferences(studentId: string): Promise<StudentFocusPreferences> {
    const response = await api.get(`/preferences/${studentId}`);
    return response.data;
  }

  static async updatePreferences(
    studentId: string,
    data: Partial<StudentFocusPreferences>
  ): Promise<StudentFocusPreferences> {
    const response = await api.patch(`/preferences/${studentId}`, data);
    return response.data;
  }

  // Analytics Methods
  static async getAnalytics(studentId: string, days: number = 30): Promise<FocusAnalytics> {
    const response = await api.get(`/analytics/${studentId}`, {
      params: { days }
    });
    return response.data;
  }

  // Health Check
  static async healthCheck(): Promise<{ status: string; service: string; timestamp: string }> {
    const response = await api.get('/health');
    return response.data;
  }
}

export default FocusTrackingService;
