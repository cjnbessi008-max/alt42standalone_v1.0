import axios from 'axios';
import type { Problem, StudentAttempt, BehaviorEvent, OverthinkingEvent, Analytics } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authAPI = {
  studentLogin: async (email: string, password: string) => {
    const { data } = await api.post('/auth/student/login', { email, password });
    return data;
  },
  studentRegister: async (name: string, email: string, password: string, gradeLevel?: string) => {
    const { data } = await api.post('/auth/student/register', { name, email, password, gradeLevel });
    return data;
  },
  teacherLogin: async (email: string, password: string) => {
    const { data } = await api.post('/auth/teacher/login', { email, password });
    return data;
  },
  teacherRegister: async (name: string, email: string, password: string) => {
    const { data } = await api.post('/auth/teacher/register', { name, email, password });
    return data;
  },
};

// Problems
export const problemsAPI = {
  getAll: async (filters?: { difficulty?: number; type?: string; limit?: number }) => {
    const { data } = await api.get<Problem[]>('/problems', { params: filters });
    return data;
  },
  getOne: async (id: string) => {
    const { data } = await api.get<Problem>(`/problems/${id}`);
    return data;
  },
  getHint: async (problemId: string, level: number) => {
    const { data } = await api.get(`/problems/${problemId}/hints/${level}`);
    return data;
  },
  create: async (problemData: Partial<Problem>) => {
    const { data } = await api.post('/problems', problemData);
    return data;
  },
};

// Attempts
export const attemptsAPI = {
  start: async (studentId: string, problemId: string) => {
    const { data } = await api.post<StudentAttempt>('/attempts/start', { studentId, problemId });
    return data;
  },
  submit: async (attemptId: string, answer: string, timeSpent: number) => {
    const { data } = await api.post(`/attempts/${attemptId}/submit`, { answer, timeSpent });
    return data;
  },
  update: async (attemptId: string, answer: string) => {
    const { data } = await api.patch(`/attempts/${attemptId}`, { answer });
    return data;
  },
  getByStudent: async (studentId: string, limit?: number) => {
    const { data } = await api.get<StudentAttempt[]>(`/attempts/student/${studentId}`, {
      params: { limit },
    });
    return data;
  },
};

// Tracking
export const trackingAPI = {
  trackEvent: async (event: BehaviorEvent) => {
    const { data } = await api.post('/tracking/event', event);
    return data;
  },
  trackBatch: async (events: BehaviorEvent[]) => {
    const { data } = await api.post('/tracking/events/batch', { events });
    return data;
  },
  getAttemptEvents: async (attemptId: string, limit?: number) => {
    const { data } = await api.get(`/tracking/attempt/${attemptId}`, { params: { limit } });
    return data;
  },
  getOverthinkingEvents: async (studentId: string, resolved?: boolean, limit?: number) => {
    const { data } = await api.get<OverthinkingEvent[]>(`/tracking/overthinking/student/${studentId}`, {
      params: { resolved, limit },
    });
    return data;
  },
};

// Teachers
export const teachersAPI = {
  getStudents: async (teacherId: string) => {
    const { data } = await api.get(`/teachers/${teacherId}/students`);
    return data;
  },
  assignStudent: async (teacherId: string, studentId: string) => {
    const { data } = await api.post(`/teachers/${teacherId}/students/${studentId}`);
    return data;
  },
  getAlerts: async (teacherId: string, resolved?: boolean, limit?: number) => {
    const { data } = await api.get<OverthinkingEvent[]>(`/teachers/${teacherId}/alerts`, {
      params: { resolved, limit },
    });
    return data;
  },
  getAnalytics: async (teacherId: string, startDate?: string, endDate?: string) => {
    const { data } = await api.get<Analytics>(`/teachers/${teacherId}/analytics`, {
      params: { startDate, endDate },
    });
    return data;
  },
};

export default api;
