/**
 * REST API Service
 */

import axios from 'axios';
import type { MetacognitionState, FocusAnalysis, LearningInsight } from '../../../shared/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const apiService = {
  // Metacognition endpoints
  async getMetacognitionState(
    studentId: string,
    params?: {
      moduleId?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<MetacognitionState> {
    const response = await api.get(`/metacognition/${studentId}`, { params });
    return response.data.data;
  },

  async getLearningInsights(studentId: string): Promise<LearningInsight[]> {
    const response = await api.get(`/metacognition/${studentId}/insights`);
    return response.data.data;
  },

  async getFocusAnalysis(studentId: string): Promise<FocusAnalysis> {
    const response = await api.get(`/metacognition/${studentId}/focus-analysis`);
    return response.data.data;
  },

  // Activity endpoints
  async getCurrentActivity(studentId: string): Promise<any> {
    const response = await api.get(`/activity/${studentId}/current`);
    return response.data.data;
  },

  async getActivityHistory(
    studentId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<any[]> {
    const response = await api.get(`/activity/${studentId}/history`, {
      params: { limit, offset }
    });
    return response.data.data;
  },

  // Behavior endpoints
  async getBehaviorAnalysis(studentId: string, activityId?: string): Promise<any> {
    const response = await api.get(`/behavior/${studentId}/analysis`, {
      params: { activityId }
    });
    return response.data.data;
  }
};
