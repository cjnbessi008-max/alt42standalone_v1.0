/**
 * API Service for Color Partition backend
 */
import axios from 'axios';
import type { FunctionAnalysisRequest, FunctionAnalysisResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const functionAPI = {
  /**
   * Analyze a mathematical function
   */
  analyzeFunction: async (
    request: FunctionAnalysisRequest
  ): Promise<FunctionAnalysisResponse> => {
    const response = await apiClient.post<FunctionAnalysisResponse>(
      '/api/analyze-function',
      request
    );
    return response.data;
  },

  /**
   * Health check
   */
  healthCheck: async (): Promise<{ status: string }> => {
    const response = await apiClient.get('/');
    return response.data;
  },
};

export default apiClient;
