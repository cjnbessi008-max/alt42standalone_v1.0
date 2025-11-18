import axios, { AxiosInstance, AxiosError } from 'axios';
import { AuthResponse, User, Argument, ArgumentDetail, PaginatedResponse, ProgressStats, ApiResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(data: {
    email: string;
    username: string;
    password: string;
    full_name?: string;
    grade_level?: string;
    institution?: string;
  }): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/api/auth/register', data);
    return response.data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/api/auth/login', { email, password });
    return response.data;
  }

  async getProfile(): Promise<ApiResponse<User>> {
    const response = await this.client.get<ApiResponse<User>>('/api/auth/profile');
    return response.data;
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await this.client.put<ApiResponse<User>>('/api/auth/profile', data);
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    const response = await this.client.post<ApiResponse>('/api/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  }

  // Arguments endpoints
  async submitArgument(data: {
    content: string;
    title?: string;
    topic?: string;
    subject?: string;
    difficulty_level?: number;
  }): Promise<ApiResponse<{ argument_id: string; status: string }>> {
    const response = await this.client.post<ApiResponse>('/api/arguments', data);
    return response.data;
  }

  async getArguments(params?: {
    page?: number;
    limit?: number;
    status?: string;
    subject?: string;
  }): Promise<PaginatedResponse<Argument>> {
    const response = await this.client.get<PaginatedResponse<Argument>>('/api/arguments', { params });
    return response.data;
  }

  async getArgumentById(id: string): Promise<ApiResponse<ArgumentDetail>> {
    const response = await this.client.get<ApiResponse<ArgumentDetail>>(`/api/arguments/${id}`);
    return response.data;
  }

  async deleteArgument(id: string): Promise<ApiResponse> {
    const response = await this.client.delete<ApiResponse>(`/api/arguments/${id}`);
    return response.data;
  }

  async getArgumentStats(): Promise<ApiResponse<any>> {
    const response = await this.client.get<ApiResponse>('/api/arguments/stats');
    return response.data;
  }

  // Progress endpoints
  async getProgress(): Promise<ApiResponse<ProgressStats>> {
    const response = await this.client.get<ApiResponse<ProgressStats>>('/api/progress');
    return response.data;
  }

  async getDetailedStats(): Promise<ApiResponse<any>> {
    const response = await this.client.get<ApiResponse>('/api/progress/stats');
    return response.data;
  }

  async updateProgress(): Promise<ApiResponse<ProgressStats>> {
    const response = await this.client.post<ApiResponse<ProgressStats>>('/api/progress/update');
    return response.data;
  }

  async getLeaderboard(params?: {
    limit?: number;
    period?: 'all_time' | 'month' | 'week';
  }): Promise<ApiResponse<any[]>> {
    const response = await this.client.get<ApiResponse<any[]>>('/api/progress/leaderboard', { params });
    return response.data;
  }
}

export const api = new ApiClient();
export default api;
