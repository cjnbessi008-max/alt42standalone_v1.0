import axios from 'axios';
import type {
  ErrorCategory,
  ErrorReason,
  PatternAnalysis,
  CreateErrorReasonDTO,
  UpdateErrorReasonDTO,
} from '../types';

const api = axios.create({
  baseURL: '/api',
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

// Error Categories
export const getCategories = async (): Promise<ErrorCategory[]> => {
  const { data } = await api.get('/student/categories');
  return data.data;
};

// Error Reasons
export const createErrorReason = async (
  dto: CreateErrorReasonDTO
): Promise<ErrorReason> => {
  const { data } = await api.post(
    `/student/errors/${dto.questionErrorId}/reason`,
    dto
  );
  return data.data;
};

export const getMyErrorReasons = async (): Promise<ErrorReason[]> => {
  const { data } = await api.get('/student/errors/reasons');
  return data.data;
};

export const updateErrorReason = async (
  id: number,
  dto: UpdateErrorReasonDTO
): Promise<ErrorReason> => {
  const { data } = await api.put(`/student/errors/reasons/${id}`, dto);
  return data.data;
};

export const deleteErrorReason = async (id: number): Promise<void> => {
  await api.delete(`/student/errors/reasons/${id}`);
};

// Statistics
export const getMyErrorStats = async (daysBack: number = 30) => {
  const { data } = await api.get('/student/errors/stats', {
    params: { daysBack },
  });
  return data.data;
};

// Pattern Analysis
export const getMyPattern = async (
  daysBack: number = 30
): Promise<PatternAnalysis> => {
  const { data } = await api.get('/student/my-patterns', {
    params: { daysBack },
  });
  return data.data;
};

// Teacher endpoints
export const getStudentPattern = async (
  studentId: number,
  daysBack: number = 30
): Promise<PatternAnalysis> => {
  const { data } = await api.get(`/teacher/students/${studentId}/patterns`, {
    params: { daysBack },
  });
  return data.data;
};

export const compareStudents = async (studentIds: number[]) => {
  const { data } = await api.post('/teacher/students/compare', {
    studentIds,
  });
  return data.data;
};

export default api;
