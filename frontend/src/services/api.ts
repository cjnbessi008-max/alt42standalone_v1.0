import axios from 'axios';
import type {
  Problem,
  CheckpointResponse,
  Submission,
  LMSSubmissionResponse
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const problemAPI = {
  getAll: async (): Promise<Problem[]> => {
    const response = await api.get('/problems');
    return response.data.data;
  },

  getById: async (id: string): Promise<Problem> => {
    const response = await api.get(`/problems/${id}`);
    return response.data.data;
  },

  getByDifficulty: async (difficulty: 'easy' | 'medium' | 'hard'): Promise<Problem[]> => {
    const response = await api.get(`/problems?difficulty=${difficulty}`);
    return response.data.data;
  },
};

export const submissionAPI = {
  create: async (data: {
    student_id: string;
    problem_id: string;
    answer: any;
    time_spent_seconds?: number;
  }): Promise<{ submission_id: string; attempt_number: number; status: string }> => {
    const response = await api.post('/submissions', data);
    return response.data.data;
  },

  getById: async (id: string): Promise<Submission> => {
    const response = await api.get(`/submissions/${id}`);
    return response.data.data;
  },

  getByStudent: async (studentId: string): Promise<Submission[]> => {
    const response = await api.get(`/students/${studentId}/submissions`);
    return response.data.data;
  },
};

export const checkpointAPI = {
  validate: async (data: {
    submission_id: string;
    perform_full_validation?: boolean;
  }): Promise<CheckpointResponse> => {
    const response = await api.post('/checkpoint/validate', data);
    return response.data.data;
  },
};

export const lmsAPI = {
  submit: async (data: {
    submission_id: string;
    force_submit?: boolean;
  }): Promise<LMSSubmissionResponse> => {
    const response = await api.post('/lms/submit', data);
    return response.data.data;
  },

  getSyncStatus: async (submissionId: string): Promise<any> => {
    const response = await api.get(`/lms/sync/${submissionId}`);
    return response.data.data;
  },
};

export default api;
