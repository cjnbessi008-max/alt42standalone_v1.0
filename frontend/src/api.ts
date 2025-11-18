import axios from 'axios';
import { Student, StudentScore, StudentScoreTrend } from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const studentsApi = {
  getAll: async (): Promise<Student[]> => {
    const response = await api.get<Student[]>('/students');
    return response.data;
  },

  getById: async (id: number): Promise<Student> => {
    const response = await api.get<Student>(`/students/${id}`);
    return response.data;
  },

  getScoreTrend: async (id: number, days: number = 30): Promise<StudentScoreTrend> => {
    const response = await api.get<StudentScoreTrend>(`/students/${id}/scores`, {
      params: { days },
    });
    return response.data;
  },
};

export const scoresApi = {
  getLatest: async (): Promise<StudentScore[]> => {
    const response = await api.get<StudentScore[]>('/scores/latest');
    return response.data;
  },

  calculate: async (): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/scores/calculate');
    return response.data;
  },
};

export const healthApi = {
  check: async (): Promise<{ status: string; timestamp: string }> => {
    const response = await api.get<{ status: string; timestamp: string }>('/health');
    return response.data;
  },
};
