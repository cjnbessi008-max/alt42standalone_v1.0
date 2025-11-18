/**
 * API service for communicating with the backend
 */
import axios, { AxiosInstance } from 'axios';
import { TopMisconceptionsResponse, StudentInfo, ModuleInfo } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        if (error.response) {
          console.error('[API] Response error:', error.response.status, error.response.data);
        } else if (error.request) {
          console.error('[API] No response received:', error.request);
        } else {
          console.error('[API] Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get top misconceptions for a student in a module
   */
  async getTopMisconceptions(
    studentId: string,
    moduleId: string,
    limit: number = 3,
    timeframe: 'week' | 'month' | 'all_time' = 'all_time'
  ): Promise<TopMisconceptionsResponse> {
    const response = await this.client.get<TopMisconceptionsResponse>(
      `/api/misconceptions/students/${studentId}/modules/${moduleId}/top`,
      {
        params: { limit, timeframe },
      }
    );
    return response.data;
  }

  /**
   * Get all students
   */
  async getAllStudents(): Promise<StudentInfo[]> {
    const response = await this.client.get<StudentInfo[]>('/api/misconceptions/students');
    return response.data;
  }

  /**
   * Get modules for a student
   */
  async getStudentModules(studentId: string): Promise<ModuleInfo[]> {
    const response = await this.client.get<ModuleInfo[]>(
      `/api/misconceptions/students/${studentId}/modules`
    );
    return response.data;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; database_connected: boolean }> {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const apiService = new ApiService();
