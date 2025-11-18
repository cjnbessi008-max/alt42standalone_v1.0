import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
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

export default api;

// API functions
export const authAPI = {
  login: (email: string, ltiUserId?: string) =>
    api.post('/api/auth/login', { email, ltiUserId }),
  verify: () => api.get('/api/auth/verify'),
};

export const sessionAPI = {
  start: (courseId?: string, contextId?: string) =>
    api.post('/api/sessions/start', { courseId, contextId }),
  end: (sessionId: number) =>
    api.post(`/api/sessions/${sessionId}/end`),
  get: (sessionId: number) =>
    api.get(`/api/sessions/${sessionId}`),
  getUserSessions: (userId: number, limit = 10) =>
    api.get(`/api/sessions/user/${userId}?limit=${limit}`),
};

export const questionAPI = {
  create: (data: {
    sessionId: number;
    questionNumber: number;
    questionText: string;
    questionType: string;
    correctAnswer: string;
    difficultyLevel?: number;
  }) => api.post('/api/questions', data),
  answer: (questionId: number, data: {
    userAnswer: string;
    responseTimeMs: number;
    hesitationCount?: number;
    clickCount?: number;
    keystrokeCount?: number;
    focusLostCount?: number;
  }) => api.post(`/api/questions/${questionId}/answer`, data),
  getSessionQuestions: (sessionId: number) =>
    api.get(`/api/questions/session/${sessionId}`),
};

export const staminaAPI = {
  getSessionMetrics: (sessionId: number) =>
    api.get(`/api/stamina/session/${sessionId}`),
  getSessionTrend: (sessionId: number) =>
    api.get(`/api/stamina/session/${sessionId}/trend`),
  getUserHistory: (userId: number, limit = 30) =>
    api.get(`/api/stamina/user/${userId}/history?limit=${limit}`),
  getUserStats: (userId: number) =>
    api.get(`/api/stamina/user/${userId}/stats`),
};

export const dashboardAPI = {
  getOverview: (contextId?: string) =>
    api.get(`/api/dashboard/overview${contextId ? `?contextId=${contextId}` : ''}`),
  getStudentAnalysis: (userId: number) =>
    api.get(`/api/dashboard/student/${userId}`),
  getClassStats: (contextId?: string) =>
    api.get(`/api/dashboard/class-stats${contextId ? `?contextId=${contextId}` : ''}`),
  getAlerts: (contextId?: string) =>
    api.get(`/api/dashboard/alerts${contextId ? `?contextId=${contextId}` : ''}`),
  logAccess: (contextId?: string) =>
    api.post('/api/dashboard/access-log', { contextId }),
};
