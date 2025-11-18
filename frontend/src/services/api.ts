import axios from 'axios';
import type {
  Problem,
  PredictionRequest,
  PredictionResponse,
  AnswerSubmit,
  AttemptResponse
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const problemApi = {
  getProblems: async (): Promise<Problem[]> => {
    const response = await api.get('/api/problems');
    return response.data;
  },

  getProblem: async (id: number): Promise<Problem> => {
    const response = await api.get(`/api/problems/${id}`);
    return response.data;
  },

  createProblem: async (problem: Omit<Problem, 'id' | 'created_at'>): Promise<Problem> => {
    const response = await api.post('/api/problems', problem);
    return response.data;
  },
};

export const predictionApi = {
  predictAnswer: async (request: PredictionRequest): Promise<PredictionResponse> => {
    const response = await api.post('/api/predict', request);
    return response.data;
  },

  submitAnswer: async (answer: AnswerSubmit): Promise<AttemptResponse> => {
    const response = await api.post('/api/submit', answer);
    return response.data;
  },
};

export const statsApi = {
  getStats: async () => {
    const response = await api.get('/api/stats');
    return response.data;
  },
};

export default api;
