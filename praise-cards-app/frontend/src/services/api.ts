import axios from 'axios';
import type { Student, PraiseCardFeed, PraiseCard, Comment, LearningSession } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Students API
export const studentsApi = {
  create: (data: { name: string; email: string; grade_level: number; profile_image?: string }) =>
    api.post<Student>('/students/', data),

  get: (id: string) =>
    api.get<Student>(`/students/${id}`),

  list: (skip = 0, limit = 100) =>
    api.get<Student[]>('/students/', { params: { skip, limit } }),

  update: (id: string, data: Partial<Student>) =>
    api.patch<Student>(`/students/${id}`, data),
};

// Learning Sessions API
export const learningSessionsApi = {
  create: (data: LearningSession) =>
    api.post('/learning-sessions/', data),

  get: (id: string) =>
    api.get(`/learning-sessions/${id}`),

  getStudentSessions: (studentId: string, skip = 0, limit = 50) =>
    api.get(`/learning-sessions/student/${studentId}`, { params: { skip, limit } }),
};

// Praise Cards API
export const praiseCardsApi = {
  getFeed: (studentId?: string, page = 1, pageSize = 20) =>
    api.get<PraiseCardFeed>('/praise-cards/feed', {
      params: { student_id: studentId, page, page_size: pageSize },
    }),

  get: (id: string) =>
    api.get<PraiseCard>(`/praise-cards/${id}`),

  getLatest: (studentId: string) =>
    api.get<PraiseCard | null>(`/praise-cards/student/${studentId}/latest`),

  getStats: (studentId: string) =>
    api.get(`/praise-cards/student/${studentId}/stats`),

  delete: (id: string) =>
    api.delete(`/praise-cards/${id}`),
};

// Interactions API
export const interactionsApi = {
  like: (cardId: string, studentId: string) =>
    api.post('/interactions/like', null, { params: { praise_card_id: cardId, student_id: studentId } }),

  unlike: (cardId: string, studentId: string) =>
    api.delete(`/interactions/like/${cardId}/${studentId}`),

  comment: (cardId: string, studentId: string, commentText: string) =>
    api.post('/interactions/comment', null, {
      params: { praise_card_id: cardId, student_id: studentId, comment_text: commentText },
    }),

  getComments: (cardId: string, skip = 0, limit = 50) =>
    api.get<Comment[]>(`/interactions/card/${cardId}/comments`, { params: { skip, limit } }),

  deleteComment: (interactionId: string) =>
    api.delete(`/interactions/comment/${interactionId}`),

  hasLiked: (cardId: string, studentId: string) =>
    api.get<{ has_liked: boolean }>(`/interactions/card/${cardId}/has-liked/${studentId}`),
};

export default api;
