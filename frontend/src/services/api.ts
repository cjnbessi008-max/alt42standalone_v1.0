/**
 * API 서비스
 */

import axios from 'axios';
import type { IntegralProblem, CoreRule, APIResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const problemAPI = {
  /**
   * 샘플 문제 목록 가져오기
   */
  async getSampleProblems(): Promise<IntegralProblem[]> {
    const response = await api.get<APIResponse<IntegralProblem[]>>('/api/problems/sample/list');
    return response.data.data || [];
  },

  /**
   * Moodle에서 문제 목록 가져오기
   */
  async getProblems(limit: number = 10): Promise<any[]> {
    const response = await api.get<APIResponse<any[]>>(`/api/problems?limit=${limit}`);
    return response.data.data || [];
  },

  /**
   * 특정 문제 가져오기
   */
  async getProblem(id: string): Promise<any> {
    const response = await api.get<APIResponse<any>>(`/api/problems/${id}`);
    return response.data.data;
  },

  /**
   * LaTeX 수식 분석
   */
  async analyzeProblem(latex: string, problemText: string): Promise<IntegralProblem> {
    const response = await api.post<APIResponse<IntegralProblem>>('/api/problems/analyze', {
      latex,
      problemText,
    });
    return response.data.data!;
  },

  /**
   * 모든 핵심 규칙 가져오기
   */
  async getAllRules(): Promise<CoreRule[]> {
    const response = await api.get<APIResponse<CoreRule[]>>('/api/problems/rules/all');
    return response.data.data || [];
  },
};

export default api;
