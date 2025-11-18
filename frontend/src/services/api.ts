/**
 * API Service
 * Handles all backend API calls
 */

import axios, { AxiosInstance } from 'axios';
import {
  Student,
  Problem,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  GetNextProblemResponse,
  StudentProgress,
  TeacherDashboardData,
} from '@shared/types';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || '/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Student endpoints
  async getStudentProfile(studentId: string): Promise<StudentProgress> {
    const response = await this.client.get<StudentProgress>(`/students/${studentId}`);
    return response.data;
  }

  async getNextProblem(studentId: string): Promise<GetNextProblemResponse> {
    const response = await this.client.get<GetNextProblemResponse>(
      `/students/${studentId}/next-problem`
    );
    return response.data;
  }

  async submitAnswer(
    studentId: string,
    data: SubmitAnswerRequest
  ): Promise<SubmitAnswerResponse> {
    const response = await this.client.post<SubmitAnswerResponse>(
      `/students/${studentId}/submit`,
      data
    );
    return response.data;
  }

  async getStudentProgress(studentId: string): Promise<StudentProgress> {
    const response = await this.client.get<StudentProgress>(
      `/students/${studentId}/progress`
    );
    return response.data;
  }

  // Teacher endpoints
  async getTeacherDashboard(): Promise<TeacherDashboardData> {
    const response = await this.client.get<TeacherDashboardData>('/teacher/dashboard');
    return response.data;
  }

  async getAllStudents(): Promise<Student[]> {
    const response = await this.client.get<Student[]>('/teacher/students');
    return response.data;
  }

  async getStudentDetail(studentId: string): Promise<StudentProgress> {
    const response = await this.client.get<StudentProgress>(
      `/teacher/students/${studentId}`
    );
    return response.data;
  }

  async getAnalytics(): Promise<any> {
    const response = await this.client.get('/teacher/analytics');
    return response.data;
  }
}

export const api = new ApiService();
export default api;
