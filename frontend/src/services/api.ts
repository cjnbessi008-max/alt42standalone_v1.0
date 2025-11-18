import axios from 'axios';
import type { EmotionRecord, LearningSession, DailyEmotionSummary } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Emotion API
export const emotionApi = {
  create: (data: {
    student_id: string;
    session_id?: string;
    emotion_type: string;
    intensity: number;
    note?: string;
  }) => api.post<EmotionRecord>('/emotions', data),

  getByStudent: (studentId: string, limit?: number) =>
    api.get<EmotionRecord[]>(`/emotions/student/${studentId}`, { params: { limit } }),

  getBySession: (sessionId: string) =>
    api.get<EmotionRecord[]>(`/emotions/session/${sessionId}`),

  getDistribution: (studentId: string, days?: number) =>
    api.get<Record<string, number>>(`/emotions/student/${studentId}/distribution`, {
      params: { days },
    }),

  update: (id: string, data: Partial<EmotionRecord>) =>
    api.put<EmotionRecord>(`/emotions/${id}`, data),

  delete: (id: string) => api.delete(`/emotions/${id}`),
};

// Session API
export const sessionApi = {
  start: (data: {
    student_id: string;
    course_id: string;
    course_name: string;
    activity_type?: string;
  }) => api.post<LearningSession>('/sessions/start', data),

  end: (sessionId: string) => api.put<LearningSession>(`/sessions/${sessionId}/end`, {}),

  getById: (sessionId: string) => api.get<LearningSession>(`/sessions/${sessionId}`),

  getByStudent: (studentId: string, limit?: number) =>
    api.get<LearningSession[]>(`/sessions/student/${studentId}`, { params: { limit } }),

  getActive: (studentId: string) =>
    api.get<LearningSession[]>(`/sessions/student/${studentId}/active`),

  getStats: (studentId: string, days?: number) =>
    api.get(`/sessions/student/${studentId}/stats`, { params: { days } }),
};

// Summary API
export const summaryApi = {
  getDaily: (studentId: string, date: string) =>
    api.get<DailyEmotionSummary>(`/summaries/student/${studentId}`, { params: { date } }),

  getRange: (studentId: string, startDate: string, endDate: string) =>
    api.get<DailyEmotionSummary[]>(`/summaries/student/${studentId}/range`, {
      params: { startDate, endDate },
    }),

  generate: (studentId: string, date: string) =>
    api.post<DailyEmotionSummary>(`/summaries/student/${studentId}/generate`, { date }),

  generateAll: (date?: string) =>
    api.post('/summaries/generate-all', { date }),
};

// LMS API
export const lmsApi = {
  createIntegration: (data: {
    institution_name: string;
    lms_type: string;
    lms_url: string;
    client_id: string;
    client_secret: string;
  }) => api.post('/lms/integrations', data),

  getIntegration: (id: string) => api.get(`/lms/integrations/${id}`),

  getActiveIntegrations: () => api.get('/lms/integrations'),

  syncStudents: (id: string) => api.post(`/lms/integrations/${id}/sync`),
};

export default api;
