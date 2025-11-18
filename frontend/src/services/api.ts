/**
 * API Service for Higher Derivative Lines
 * Handles communication with the FastAPI backend
 */

import axios from 'axios';
import type { GraphRequest, GraphData, MoodleQuestionRequest, MoodleResponse } from '@/types/derivative';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const derivativeApi = {
  /**
   * Calculate derivatives of a function
   */
  calculateDerivatives: async (functionStr: string, maxOrder: number = 4) => {
    const response = await api.post('/api/derivatives', {
      function: functionStr,
      max_order: maxOrder,
    });
    return response.data;
  },

  /**
   * Generate graph data for derivatives
   */
  generateGraph: async (request: GraphRequest): Promise<GraphData> => {
    const response = await api.post<GraphData>('/api/graph', {
      function: request.function,
      max_order: request.max_order || 4,
      domain_min: request.domain_min || -10,
      domain_max: request.domain_max || 10,
      num_points: request.num_points || 500,
      color_scheme: request.color_scheme || 'professional',
      visible_orders: request.visible_orders,
    });
    return response.data;
  },

  /**
   * Get line styles configuration
   */
  getStyles: async (maxOrder: number = 4, colorScheme: string = 'professional') => {
    const response = await api.get('/api/styles', {
      params: {
        max_order: maxOrder,
        color_scheme: colorScheme,
      },
    });
    return response.data;
  },

  /**
   * Get available color schemes
   */
  getColorSchemes: async () => {
    const response = await api.get('/api/color-schemes');
    return response.data;
  },

  /**
   * Process Moodle question
   */
  processMoodleQuestion: async (request: MoodleQuestionRequest): Promise<MoodleResponse> => {
    const response = await api.post<MoodleResponse>('/api/moodle/question', request);
    return response.data;
  },

  /**
   * Get example functions
   */
  getExamples: async () => {
    const response = await api.get('/api/examples');
    return response.data;
  },

  /**
   * Health check
   */
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default derivativeApi;
