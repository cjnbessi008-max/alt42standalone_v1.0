/**
 * API 클라이언트
 */
import axios from 'axios';
import type {
  Student,
  StudentDetail,
  RoutineCard,
  LearningProgress,
  CardGenerationRequest,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 에러 처리 인터셉터
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// 학생 API
export const studentApi = {
  list: async (): Promise<Student[]> => {
    const response = await apiClient.get('/students');
    return response.data;
  },

  get: async (studentId: string): Promise<StudentDetail> => {
    const response = await apiClient.get(`/students/${studentId}`);
    return response.data;
  },

  create: async (data: Partial<Student>): Promise<Student> => {
    const response = await apiClient.post('/students', data);
    return response.data;
  },

  getProgress: async (studentId: string): Promise<LearningProgress[]> => {
    const response = await apiClient.get(`/students/${studentId}/progress`);
    return response.data;
  },
};

// 카드 API
export const cardApi = {
  generate: async (request: CardGenerationRequest): Promise<RoutineCard> => {
    const response = await apiClient.post('/cards/generate', request);
    return response.data;
  },

  getToday: async (studentId: string): Promise<RoutineCard> => {
    const response = await apiClient.get(`/cards/today/${studentId}`);
    return response.data;
  },

  get: async (cardId: string): Promise<RoutineCard> => {
    const response = await apiClient.get(`/cards/${cardId}`);
    return response.data;
  },

  getStudentCards: async (studentId: string, limit = 30): Promise<RoutineCard[]> => {
    const response = await apiClient.get(`/cards/student/${studentId}`, {
      params: { limit },
    });
    return response.data;
  },

  complete: async (cardId: string): Promise<RoutineCard> => {
    const response = await apiClient.post(`/cards/${cardId}/complete`);
    return response.data;
  },
};

export default apiClient;
