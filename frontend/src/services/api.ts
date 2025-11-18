/**
 * API service for communicating with the backend
 */
import axios, { AxiosInstance } from 'axios';
import type {
  Student,
  Problem,
  StudentAttempt,
  MistakePattern,
  MistakeWarning,
  WarningCheckResponse,
  PatternAnalysisResponse,
  PatternSummary,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

class APIService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  // Student endpoints
  async createStudent(data: Partial<Student>): Promise<Student> {
    const response = await this.client.post('/students/', data);
    return response.data;
  }

  async getStudent(studentId: string): Promise<Student> {
    const response = await this.client.get(`/students/${studentId}`);
    return response.data;
  }

  async submitAttempt(data: {
    student_id: string;
    problem_id: string;
    module_id: string;
    submitted_answer: Record<string, any>;
    time_spent_seconds?: number;
  }): Promise<StudentAttempt> {
    const response = await this.client.post('/students/attempts/', data);
    return response.data;
  }

  async getStudentAttempts(
    studentId: string,
    moduleId?: string,
    limit: number = 100
  ): Promise<StudentAttempt[]> {
    const response = await this.client.get(`/students/${studentId}/attempts`, {
      params: { module_id: moduleId, limit },
    });
    return response.data;
  }

  // Mistake pattern endpoints
  async analyzePatterns(
    studentId: string,
    options?: {
      module_id?: string;
      days_back?: number;
      min_frequency?: number;
    }
  ): Promise<PatternAnalysisResponse> {
    const response = await this.client.post(`/patterns/analyze/${studentId}`, null, {
      params: options,
    });
    return response.data;
  }

  async getStudentPatterns(
    studentId: string,
    options?: {
      module_id?: string;
      include_inactive?: boolean;
    }
  ): Promise<MistakePattern[]> {
    const response = await this.client.get(`/patterns/student/${studentId}`, {
      params: options,
    });
    return response.data;
  }

  async getPatternSummary(
    studentId: string,
    moduleId?: string
  ): Promise<PatternSummary> {
    const response = await this.client.get(`/patterns/summary/${studentId}`, {
      params: { module_id: moduleId },
    });
    return response.data;
  }

  async checkWarnings(data: {
    student_id: string;
    problem_id: string;
    problem_content: Record<string, any>;
  }): Promise<WarningCheckResponse> {
    const response = await this.client.post('/patterns/check-warnings', data);
    return response.data;
  }

  async dismissWarning(warningId: string): Promise<void> {
    await this.client.post(`/patterns/warnings/${warningId}/dismiss`);
  }

  async getStudentWarnings(
    studentId: string,
    includeDismissed: boolean = false,
    limit: number = 50
  ): Promise<MistakeWarning[]> {
    const response = await this.client.get(`/patterns/warnings/student/${studentId}`, {
      params: { include_dismissed: includeDismissed, limit },
    });
    return response.data;
  }

  // LMS integration endpoints
  async syncFromLMS(data: {
    sync_type: string;
    lms_endpoint: string;
    filters?: Record<string, any>;
  }): Promise<any> {
    const response = await this.client.post('/lms/sync', data);
    return response.data;
  }

  async getSyncStatus(syncId: string): Promise<any> {
    const response = await this.client.get(`/lms/sync/${syncId}`);
    return response.data;
  }

  async getStudentByLMSId(lmsId: string): Promise<Student> {
    const response = await this.client.get(`/lms/student/lms/${lmsId}`);
    return response.data;
  }
}

export const apiService = new APIService();
export default apiService;
