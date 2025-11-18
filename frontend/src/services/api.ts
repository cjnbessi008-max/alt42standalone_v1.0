import axios from 'axios';
import type { ConceptPair, CheckWarningRequest, CheckWarningResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// API service functions
export const conceptPairApi = {
  // Get all concept pairs
  async getAll(params?: { category?: string; gradeLevel?: number }): Promise<ConceptPair[]> {
    const response = await api.get('/concept-pairs', { params });
    return response.data.data;
  },

  // Get concept pair by ID
  async getById(id: string): Promise<ConceptPair> {
    const response = await api.get(`/concept-pairs/${id}`);
    return response.data.data;
  },

  // Create new concept pair
  async create(data: Partial<ConceptPair>): Promise<ConceptPair> {
    const response = await api.post('/concept-pairs', data);
    return response.data.data;
  },

  // Get statistics for a concept pair
  async getStatistics(id: string, days: number = 30) {
    const response = await api.get(`/concept-pairs/${id}/statistics`, {
      params: { days }
    });
    return response.data.data;
  }
};

export const warningApi = {
  // Check for warnings
  async check(request: CheckWarningRequest): Promise<CheckWarningResponse> {
    const response = await api.post('/warnings/check', request);
    return response.data.data;
  },

  // Acknowledge warning
  async acknowledge(warningId: string, studentId: string, acknowledged: boolean, dismissed: boolean = false) {
    const response = await api.post(`/warnings/${warningId}/acknowledge`, {
      warningId,
      studentId,
      acknowledged,
      dismissed
    });
    return response.data;
  },

  // Update warning effectiveness
  async updateEffectiveness(
    warningId: string,
    correctedMistake: boolean,
    timeToCorrectionSeconds?: number,
    followUpPerformanceImproved?: boolean
  ) {
    const response = await api.post(`/warnings/${warningId}/effectiveness`, {
      warningId,
      correctedMistake,
      timeToCorrectionSeconds,
      followUpPerformanceImproved
    });
    return response.data;
  }
};

export default api;
