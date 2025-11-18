/**
 * API Service
 * Handles all API communication with the backend
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  ApiResponse,
  Question,
  Student,
  StudentProgress,
  StudentStats,
  LogicalOperator,
  AnimationSettings,
} from '@types/index';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add session ID or auth token if available
        const sessionId = localStorage.getItem('session_id');
        if (sessionId) {
          config.headers['X-Session-ID'] = sessionId;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // ============ Questions API ============

  async getQuestions(filters?: {
    type?: string;
    difficulty?: number;
    limit?: number;
  }): Promise<Question[]> {
    const response = await this.client.get<ApiResponse<Question[]>>('/questions', {
      params: filters,
    });
    return response.data.data || [];
  }

  async getQuestionById(id: number): Promise<Question> {
    const response = await this.client.get<ApiResponse<Question>>(`/questions/${id}`);
    if (!response.data.data) {
      throw new Error('Question not found');
    }
    return response.data.data;
  }

  async getRandomQuestion(filters?: {
    type?: string;
    difficulty?: number;
  }): Promise<Question> {
    const response = await this.client.get<ApiResponse<Question>>('/questions/random', {
      params: filters,
    });
    if (!response.data.data) {
      throw new Error('No questions available');
    }
    return response.data.data;
  }

  async createQuestion(data: Partial<Question>): Promise<Question> {
    const response = await this.client.post<ApiResponse<Question>>('/questions', data);
    if (!response.data.data) {
      throw new Error('Failed to create question');
    }
    return response.data.data;
  }

  async updateQuestion(id: number, data: Partial<Question>): Promise<Question> {
    const response = await this.client.put<ApiResponse<Question>>(`/questions/${id}`, data);
    if (!response.data.data) {
      throw new Error('Failed to update question');
    }
    return response.data.data;
  }

  async deleteQuestion(id: number): Promise<void> {
    await this.client.delete(`/questions/${id}`);
  }

  // ============ Students API ============

  async getStudent(id: number): Promise<Student> {
    const response = await this.client.get<ApiResponse<Student>>(`/students/${id}`);
    if (!response.data.data) {
      throw new Error('Student not found');
    }
    return response.data.data;
  }

  async createStudent(data: Partial<Student>): Promise<Student> {
    const response = await this.client.post<ApiResponse<Student>>('/students', data);
    if (!response.data.data) {
      throw new Error('Failed to create student');
    }
    return response.data.data;
  }

  // ============ Progress API ============

  async createProgress(data: Partial<StudentProgress>): Promise<StudentProgress> {
    const response = await this.client.post<ApiResponse<StudentProgress>>('/progress', data);
    if (!response.data.data) {
      throw new Error('Failed to create progress');
    }
    return response.data.data;
  }

  async updateProgress(id: number, data: Partial<StudentProgress>): Promise<StudentProgress> {
    const response = await this.client.put<ApiResponse<StudentProgress>>(
      `/progress/${id}`,
      data
    );
    if (!response.data.data) {
      throw new Error('Failed to update progress');
    }
    return response.data.data;
  }

  async getProgressById(id: number): Promise<StudentProgress> {
    const response = await this.client.get<ApiResponse<StudentProgress>>(`/progress/${id}`);
    if (!response.data.data) {
      throw new Error('Progress not found');
    }
    return response.data.data;
  }

  async getStudentProgress(
    studentId: number,
    questionId: number
  ): Promise<StudentProgress[]> {
    const response = await this.client.get<ApiResponse<StudentProgress[]>>(
      `/progress/student/${studentId}/question/${questionId}`
    );
    return response.data.data || [];
  }

  async getStudentStats(studentId: number): Promise<StudentStats> {
    const response = await this.client.get<ApiResponse<StudentStats>>(
      `/progress/student/${studentId}/stats`
    );
    if (!response.data.data) {
      throw new Error('Failed to get student stats');
    }
    return response.data.data;
  }

  async getRecentProgress(studentId: number, limit = 10): Promise<StudentProgress[]> {
    const response = await this.client.get<ApiResponse<StudentProgress[]>>(
      `/progress/student/${studentId}/recent`,
      { params: { limit } }
    );
    return response.data.data || [];
  }

  // ============ Operators API ============

  async getOperators(): Promise<LogicalOperator[]> {
    const response = await this.client.get<ApiResponse<LogicalOperator[]>>('/operators');
    return response.data.data || [];
  }

  async getOperatorById(id: number): Promise<LogicalOperator> {
    const response = await this.client.get<ApiResponse<LogicalOperator>>(`/operators/${id}`);
    if (!response.data.data) {
      throw new Error('Operator not found');
    }
    return response.data.data;
  }

  // ============ Animation Settings API ============

  async getAnimationSettings(): Promise<AnimationSettings[]> {
    const response = await this.client.get<ApiResponse<AnimationSettings[]>>(
      '/animation-settings'
    );
    return response.data.data || [];
  }

  async getAnimationSettingByName(name: string): Promise<AnimationSettings> {
    const response = await this.client.get<ApiResponse<AnimationSettings>>(
      `/animation-settings/${name}`
    );
    if (!response.data.data) {
      throw new Error('Animation setting not found');
    }
    return response.data.data;
  }

  // ============ Moodle Integration API ============

  async syncMoodleQuestion(moodleQuestionId: number): Promise<Question> {
    const response = await this.client.post<ApiResponse<Question>>('/moodle/sync/question', {
      moodle_question_id: moodleQuestionId,
    });
    if (!response.data.data) {
      throw new Error('Failed to sync Moodle question');
    }
    return response.data.data;
  }

  async testMoodleConnection(): Promise<{ success: boolean; site_name?: string; error?: string }> {
    const response = await this.client.get<ApiResponse>('/moodle/test');
    return response.data.data || { success: false };
  }

  // ============ Session API ============

  async createSession(studentId: number): Promise<{ session_id: string }> {
    const response = await this.client.post<ApiResponse<{ session_id: string }>>(
      '/sessions',
      {
        student_id: studentId,
        device_info: navigator.userAgent,
      }
    );
    if (!response.data.data) {
      throw new Error('Failed to create session');
    }
    return response.data.data;
  }

  async endSession(sessionId: string): Promise<void> {
    await this.client.put(`/sessions/${sessionId}/end`);
  }

  async updateSessionActivity(sessionId: string): Promise<void> {
    await this.client.put(`/sessions/${sessionId}/activity`);
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export class for testing
export default ApiService;
