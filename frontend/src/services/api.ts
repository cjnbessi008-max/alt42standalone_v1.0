import axios from 'axios';
import { ProblemRequest, StrategyResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const generateStrategy = async (request: ProblemRequest): Promise<StrategyResponse> => {
  const response = await api.post<StrategyResponse>('/api/strategy', request);
  return response.data;
};

export const getDemoStrategy = async (): Promise<StrategyResponse> => {
  const response = await api.post<StrategyResponse>('/api/strategy/demo');
  return response.data;
};

export const healthCheck = async (): Promise<{ status: string }> => {
  const response = await api.get('/health');
  return response.data;
};
