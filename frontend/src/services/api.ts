/**
 * API Service Layer
 * Communicates with PHP backend
 */

import axios, { AxiosInstance } from 'axios';
import {
  ApiResponse,
  LearningSession,
  InteractionEvent,
  DmnDriftMetrics,
  ProblemAttempt,
  AggregateStats
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('session_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        console.error('API Error:', error);
        return Promise.reject(error.response?.data || error.message);
      }
    );
  }

  // ==================== Sessions API ====================

  async createSession(studentId: number, moduleName: string): Promise<LearningSession> {
    const response = await this.client.post<ApiResponse<LearningSession>>('/sessions', {
      student_id: studentId,
      module_name: moduleName
    });
    return response.data!;
  }

  async getSession(sessionId: number): Promise<LearningSession> {
    const response = await this.client.get<ApiResponse<LearningSession>>(`/sessions/${sessionId}`);
    return response.data!;
  }

  async getStudentSessions(studentId: number): Promise<LearningSession[]> {
    const response = await this.client.get<ApiResponse<{ sessions: LearningSession[] }>>(
      `/sessions/student/${studentId}`
    );
    return response.data!.sessions;
  }

  async updateSession(sessionId: number, data: Partial<LearningSession>): Promise<void> {
    await this.client.put(`/sessions/${sessionId}`, data);
  }

  async endSession(sessionId: number): Promise<void> {
    await this.client.post(`/sessions/${sessionId}/end`);
  }

  // ==================== Events API ====================

  async trackEvent(event: Omit<InteractionEvent, 'id' | 'timestamp'>): Promise<void> {
    await this.client.post('/events', event);
  }

  async trackBatchEvents(events: Omit<InteractionEvent, 'id' | 'timestamp'>[]): Promise<void> {
    await this.client.post('/events/batch', { events });
  }

  async getSessionEvents(
    sessionId: number,
    options?: { limit?: number; offset?: number; event_type?: string }
  ): Promise<InteractionEvent[]> {
    const response = await this.client.get<ApiResponse<{ events: InteractionEvent[] }>>(
      `/events/session/${sessionId}`,
      { params: options }
    );
    return response.data!.events;
  }

  // ==================== Metrics API ====================

  async calculateMetrics(
    sessionId: number,
    windowStart?: string,
    windowEnd?: string
  ): Promise<DmnDriftMetrics> {
    const response = await this.client.post<ApiResponse<{ metrics: DmnDriftMetrics }>>(
      `/metrics/calculate/${sessionId}`,
      { window_start: windowStart, window_end: windowEnd }
    );
    return response.data!.metrics;
  }

  async getSessionMetrics(sessionId: number): Promise<DmnDriftMetrics[]> {
    const response = await this.client.get<ApiResponse<{ metrics: DmnDriftMetrics[] }>>(
      `/metrics/session/${sessionId}`
    );
    return response.data!.metrics;
  }

  async getLatestMetrics(sessionId: number): Promise<DmnDriftMetrics> {
    const response = await this.client.get<ApiResponse<DmnDriftMetrics>>(
      `/metrics/session/${sessionId}/latest`
    );
    return response.data!;
  }

  async getStudentMetrics(
    studentId: number
  ): Promise<{ metrics: DmnDriftMetrics[]; aggregate_stats: AggregateStats }> {
    const response = await this.client.get<
      ApiResponse<{ metrics: DmnDriftMetrics[]; aggregate_stats: AggregateStats }>
    >(`/metrics/student/${studentId}`);
    return response.data!;
  }

  // ==================== Problem Attempts API ====================

  async submitAnswer(attempt: Omit<ProblemAttempt, 'id' | 'attempted_at'>): Promise<void> {
    // This would be implemented based on your specific problem API
    await this.client.post('/attempts', attempt);
  }

  // ==================== LTI API ====================

  async sendGradeToMoodle(sessionId: number, score?: number): Promise<void> {
    await this.client.post('/lti/grade', {
      session_id: sessionId,
      score
    });
  }
}

export default new ApiService();
