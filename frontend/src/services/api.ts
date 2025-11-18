import axios from 'axios';
import { Quiz, QuizAttempt, FocusSettings, User } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Quiz API
export const quizApi = {
  getAll: () => api.get<Quiz[]>('/quizzes'),

  getById: (id: number) => api.get<Quiz>(`/quizzes/${id}`),

  startAttempt: (quizId: number, userId: number) =>
    api.post<QuizAttempt>(`/quizzes/${quizId}/start`, { userId }),

  submitAnswer: (attemptId: number, questionId: number, selectedOptionId: number | null, answerText?: string) =>
    api.post(`/quizzes/attempts/${attemptId}/answer`, {
      questionId,
      selectedOptionId,
      answerText,
    }),

  completeAttempt: (attemptId: number) =>
    api.post<QuizAttempt>(`/quizzes/attempts/${attemptId}/complete`),

  getResults: (attemptId: number) =>
    api.get<QuizAttempt>(`/quizzes/attempts/${attemptId}/results`),
};

// Focus Settings API
export const focusApi = {
  getSettings: (userId: number) =>
    api.get<FocusSettings>(`/focus/${userId}`),

  updateSettings: (userId: number, settings: Partial<FocusSettings>) =>
    api.put<FocusSettings>(`/focus/${userId}`, settings),

  resetSettings: (userId: number) =>
    api.delete(`/focus/${userId}`),
};

// User API
export const userApi = {
  getAll: () => api.get<User[]>('/users'),

  getById: (id: number) => api.get<User>(`/users/${id}`),

  getHistory: (id: number) => api.get<QuizAttempt[]>(`/users/${id}/history`),
};

export default api;
