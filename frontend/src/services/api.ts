import axios, { AxiosInstance } from 'axios';
import { TimelineEvent, SessionSummary, SessionAnalytics, StudentProgress } from '../types/timeline';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_PREFIX = '/api';

class TimelineAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}${API_PREFIX}`,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    // Add request interceptor for auth (if needed)
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

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Record a single timeline event
   */
  async recordEvent(event: TimelineEvent): Promise<TimelineEvent> {
    const response = await this.client.post('/timeline/events', event);
    return response.data.data;
  }

  /**
   * Record multiple timeline events in batch
   */
  async recordEventsBatch(events: TimelineEvent[]): Promise<TimelineEvent[]> {
    const response = await this.client.post('/timeline/events/batch', { events });
    return response.data.data;
  }

  /**
   * Get session timeline
   */
  async getSessionTimeline(sessionId: string): Promise<{
    session_id: string;
    summary: SessionSummary;
    events: TimelineEvent[];
  }> {
    const response = await this.client.get(`/timeline/session/${sessionId}`);
    return response.data.data;
  }

  /**
   * Get session analytics
   */
  async getSessionAnalytics(sessionId: string): Promise<SessionAnalytics> {
    const response = await this.client.get(`/timeline/session/${sessionId}/analytics`);
    return response.data.data;
  }

  /**
   * Get student progress
   */
  async getStudentProgress(studentId: string, moduleId?: string): Promise<StudentProgress[]> {
    const params = moduleId ? { module_id: moduleId } : {};
    const response = await this.client.get(`/timeline/student/${studentId}/progress`, { params });
    return response.data.data;
  }

  /**
   * Get student sessions
   */
  async getStudentSessions(
    studentId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      moduleId?: string;
    }
  ): Promise<SessionSummary[]> {
    const params: any = {};
    if (options?.startDate) params.start_date = options.startDate.toISOString();
    if (options?.endDate) params.end_date = options.endDate.toISOString();
    if (options?.moduleId) params.module_id = options.moduleId;

    const response = await this.client.get(`/timeline/student/${studentId}/sessions`, { params });
    return response.data.data;
  }

  /**
   * Get module analytics
   */
  async getModuleAnalytics(moduleId: string): Promise<any> {
    const response = await this.client.get(`/timeline/module/${moduleId}/analytics`);
    return response.data.data;
  }
}

class LMSAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}${API_PREFIX}`,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
  }

  /**
   * Get student timeline for LMS
   */
  async getStudentTimeline(
    studentId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      moduleId?: string;
    }
  ): Promise<any> {
    const params: any = {};
    if (options?.startDate) params.start_date = options.startDate.toISOString();
    if (options?.endDate) params.end_date = options.endDate.toISOString();
    if (options?.moduleId) params.module_id = options.moduleId;

    const response = await this.client.get(`/lms/student/${studentId}/timeline`, { params });
    return response.data.data;
  }

  /**
   * Get module analytics for LMS
   */
  async getModuleAnalytics(moduleId: string): Promise<any> {
    const response = await this.client.get(`/lms/module/${moduleId}/analytics`);
    return response.data.data;
  }

  /**
   * Export student data
   */
  async exportData(
    studentId: string,
    moduleId: string,
    options?: {
      exportType?: 'timeline' | 'summary' | 'analytics';
      format?: 'json' | 'csv';
    }
  ): Promise<any> {
    const response = await this.client.post('/lms/export', {
      student_id: studentId,
      module_id: moduleId,
      export_type: options?.exportType || 'timeline',
      format: options?.format || 'json'
    });
    return response.data.data;
  }

  /**
   * Get xAPI statements
   */
  async getXAPIStatements(options?: {
    studentId?: string;
    moduleId?: string;
    since?: Date;
    until?: Date;
    limit?: number;
  }): Promise<any> {
    const params: any = {};
    if (options?.studentId) params.student_id = options.studentId;
    if (options?.moduleId) params.module_id = options.moduleId;
    if (options?.since) params.since = options.since.toISOString();
    if (options?.until) params.until = options.until.toISOString();
    if (options?.limit) params.limit = options.limit;

    const response = await this.client.get('/lms/xapi/statements', { params });
    return response.data;
  }
}

export const timelineApi = new TimelineAPI();
export const lmsApi = new LMSAPI();
