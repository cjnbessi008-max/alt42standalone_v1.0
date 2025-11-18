/**
 * API service for making HTTP requests to the backend
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (username: string, password: string) =>
    api.post('/auth/login', new URLSearchParams({ username, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  getCurrentUser: () => api.get('/auth/me'),
};

// Focus Sessions API
export const sessionsApi = {
  create: (data: any) => api.post('/sessions', data),
  getAll: (skip = 0, limit = 100) => api.get(`/sessions?skip=${skip}&limit=${limit}`),
  getById: (id: number) => api.get(`/sessions/${id}`),
  update: (id: number, data: any) => api.patch(`/sessions/${id}`, data),
  createMetric: (sessionId: number, data: any) => api.post(`/sessions/${sessionId}/metrics`, data),
  getMetrics: (sessionId: number) => api.get(`/sessions/${sessionId}/metrics`),
  analyze: (sessionId: number) => api.post(`/sessions/${sessionId}/analyze`),
};

// Analytics API
export const analyticsApi = {
  getTrends: (days = 30) => api.get(`/analytics/trends?days=${days}`),
  getTimePatterns: (days = 30) => api.get(`/analytics/time-patterns?days=${days}`),
};

// Recommendations API
export const recommendationsApi = {
  generate: (topN = 5, minFocusScore?: number) => {
    const params = new URLSearchParams({ top_n: topN.toString() });
    if (minFocusScore !== undefined) {
      params.append('min_focus_score', minFocusScore.toString());
    }
    return api.post(`/recommendations/generate?${params}`);
  },
  getAll: (activeOnly = true) => api.get(`/recommendations?active_only=${activeOnly}`),
  getSummary: () => api.get('/recommendations/summary'),
  getOptimalDays: () => api.get('/recommendations/optimal-days'),
  getOptimalHours: () => api.get('/recommendations/optimal-hours'),
};

export default api;
