import axios from 'axios';
import type { Student, LearningActivity, GrowthInsight, DailyGrowthReport, ProblemAttempt } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Students
export const studentsApi = {
  create: (data: Partial<Student>) =>
    api.post<Student>('/api/students', data),

  get: (id: string) =>
    api.get<Student>(`/api/students/${id}`),

  list: (params?: { skip?: number; limit?: number; is_teacher?: boolean }) =>
    api.get<Student[]>('/api/students', { params }),

  delete: (id: string) =>
    api.delete(`/api/students/${id}`),
};

// Learning Activities
export const activitiesApi = {
  create: (data: Partial<LearningActivity>) =>
    api.post<LearningActivity>('/api/activities', data),

  get: (id: string) =>
    api.get<LearningActivity>(`/api/activities/${id}`),

  update: (id: string, data: Partial<LearningActivity>) =>
    api.patch<LearningActivity>(`/api/activities/${id}`, data),

  getByStudent: (studentId: string, params?: { skip?: number; limit?: number }) =>
    api.get<LearningActivity[]>(`/api/activities/student/${studentId}`, { params }),

  addAttempt: (activityId: string, data: Partial<ProblemAttempt>) =>
    api.post<ProblemAttempt>(`/api/activities/${activityId}/attempts`, data),

  getAttempts: (activityId: string) =>
    api.get<ProblemAttempt[]>(`/api/activities/${activityId}/attempts`),
};

// Insights
export const insightsApi = {
  getDaily: (studentId: string, date?: string) =>
    api.get<DailyGrowthReport>(`/api/insights/daily/${studentId}`, {
      params: date ? { date } : undefined,
    }),

  getRecent: (studentId: string, days: number = 7) =>
    api.get<GrowthInsight[]>(`/api/insights/student/${studentId}`, {
      params: { days },
    }),

  generateAsync: (studentId: string) =>
    api.post(`/api/insights/generate/${studentId}`),
};

export default api;
