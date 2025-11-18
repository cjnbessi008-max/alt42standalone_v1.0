import axios from 'axios';
import type { Problem, Summary, LearningPattern, Trend } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 응답 인터셉터
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const problemsApi = {
  /**
   * 오늘 푼 문제 동기화 (Moodle에서)
   */
  syncTodayProblems: async (moodleUserId: number) => {
    const response = await api.get(`/problems/today/${moodleUserId}`);
    return response.data;
  },

  /**
   * 오늘 푼 문제 목록 조회 (DB에서)
   */
  getTodayProblems: async (studentId: string): Promise<Problem[]> => {
    const response = await api.get(`/problems/student/${studentId}/today`);
    return response.data.data;
  },

  /**
   * 특정 날짜의 문제 목록 조회
   */
  getProblemsByDate: async (
    studentId: string,
    date: string
  ): Promise<Problem[]> => {
    const response = await api.get(
      `/problems/student/${studentId}/date/${date}`
    );
    return response.data.data;
  },
};

export const analyticsApi = {
  /**
   * 오늘의 학습 요약
   */
  getSummary: async (studentId: string): Promise<Summary> => {
    const response = await api.get(`/analytics/student/${studentId}/summary`);
    return response.data.data;
  },

  /**
   * 학습 패턴 조회
   */
  getLearningPattern: async (
    studentId: string,
    date?: string
  ): Promise<LearningPattern | null> => {
    const url = `/analytics/student/${studentId}/pattern${
      date ? `?date=${date}` : ''
    }`;
    const response = await api.get(url);
    return response.data.data;
  },

  /**
   * 학습 추세 조회
   */
  getTrends: async (studentId: string, days: number = 7): Promise<Trend[]> => {
    const response = await api.get(
      `/analytics/student/${studentId}/trends?days=${days}`
    );
    return response.data.data;
  },
};

export const studentsApi = {
  /**
   * Moodle 사용자 정보 조회
   */
  getMoodleUser: async (moodleUserId: number) => {
    const response = await api.get(`/students/moodle/${moodleUserId}`);
    return response.data.data;
  },

  /**
   * 학생 정보 조회
   */
  getStudent: async (studentId: string) => {
    const response = await api.get(`/students/${studentId}`);
    return response.data.data;
  },
};

export default api;
