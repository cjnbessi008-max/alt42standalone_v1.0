import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: { email: string; password: string; name: string; role?: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  getProfile: () =>
    api.get('/auth/profile'),

  updateProfile: (data: { name?: string; currentPassword?: string; newPassword?: string }) =>
    api.put('/auth/profile', data),
};

// Problems API
export const problemsAPI = {
  getAll: (params?: { difficulty?: string; tags?: string; search?: string; limit?: number; offset?: number }) =>
    api.get('/problems', { params }),

  getById: (id: number) =>
    api.get(`/problems/${id}`),

  create: (data: any) =>
    api.post('/problems', data),

  update: (id: number, data: any) =>
    api.put(`/problems/${id}`, data),

  delete: (id: number) =>
    api.delete(`/problems/${id}`),
};

// Attempts API
export const attemptsAPI = {
  submit: (problemId: number, data: any) =>
    api.post(`/attempts/problem/${problemId}`, data),

  getForProblem: (problemId: number) =>
    api.get(`/attempts/problem/${problemId}`),

  getById: (id: number) =>
    api.get(`/attempts/${id}`),

  getAll: (params?: { limit?: number; offset?: number }) =>
    api.get('/attempts', { params }),
};

// Users API
export const usersAPI = {
  getLeaderboard: (limit?: number) =>
    api.get('/users/leaderboard', { params: { limit } }),

  getAll: (params?: { role?: string; search?: string; limit?: number; offset?: number }) =>
    api.get('/users', { params }),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: () =>
    api.get('/analytics/dashboard'),
};
