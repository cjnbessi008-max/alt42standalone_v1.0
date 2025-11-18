import axios from 'axios';
import { useAuthStore } from '../store/auth.store';
import type {
  LoginRequest,
  RegisterRequest,
  ApiResponse,
  User,
  Problem,
  Response as ResponseType,
  SubmitResponseRequest,
  Progress,
  PaginatedResponse,
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authApi = {
  register: (data: RegisterRequest) =>
    api.post<ApiResponse<User>>('/auth/register', data),

  login: (data: LoginRequest) =>
    api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', data),

  logout: () => api.post<ApiResponse<null>>('/auth/logout'),

  getProfile: () => api.get<ApiResponse<User>>('/auth/profile'),
};

// Problem APIs
export const problemApi = {
  getProblems: (params?: { difficulty?: number; limit?: number; offset?: number }) =>
    api.get<ApiResponse<PaginatedResponse<Problem>>>('/problems', { params }),

  getProblemById: (id: number) =>
    api.get<ApiResponse<Problem>>(`/problems/${id}`),

  createProblem: (data: Omit<Problem, 'id' | 'createdAt'>) =>
    api.post<ApiResponse<Problem>>('/problems', data),
};

// Response APIs
export const responseApi = {
  submitResponse: (data: SubmitResponseRequest) =>
    api.post<ApiResponse<ResponseType>>('/responses', data),

  getUserResponses: (userId: number, params?: { limit?: number; offset?: number }) =>
    api.get<ApiResponse<PaginatedResponse<ResponseType>>>(`/responses/user/${userId}`, {
      params,
    }),

  getResponseById: (id: number) =>
    api.get<ApiResponse<ResponseType>>(`/responses/${id}`),
};

// Stats APIs
export const statsApi = {
  getUserStats: (userId: number) =>
    api.get<
      ApiResponse<{
        progress: Progress;
        recentResponses: ResponseType[];
        stats: {
          totalCorrect: number;
          totalIncorrect: number;
        };
      }>
    >(`/stats/user/${userId}`),

  getOverallStats: () =>
    api.get<
      ApiResponse<{
        overview: {
          totalUsers: number;
          totalProblems: number;
          totalResponses: number;
          overallAccuracy: number;
          averageConfidence: number;
        };
        recentActivity: ResponseType[];
      }>
    >('/stats/overall'),
};

export default api;
