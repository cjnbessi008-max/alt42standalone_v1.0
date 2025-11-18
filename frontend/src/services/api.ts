import axios, { AxiosInstance } from 'axios';
import { Problem, ApiResponse } from '../types';

// API 클라이언트 설정
const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API 서비스
export const problemService = {
  // 모든 문제 가져오기
  async getAllProblems(): Promise<Problem[]> {
    try {
      const response = await apiClient.get<ApiResponse<Problem[]>>('/problems');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch problems');
    } catch (error) {
      console.error('Error fetching problems:', error);
      throw error;
    }
  },

  // 특정 문제 가져오기
  async getProblemById(id: string): Promise<Problem> {
    try {
      const response = await apiClient.get<ApiResponse<Problem>>(`/problems/${id}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch problem');
    } catch (error) {
      console.error('Error fetching problem:', error);
      throw error;
    }
  },

  // 랜덤 문제 가져오기
  async getRandomProblem(): Promise<Problem> {
    try {
      const response = await apiClient.get<ApiResponse<Problem>>('/problems/random');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to fetch random problem');
    } catch (error) {
      console.error('Error fetching random problem:', error);
      throw error;
    }
  },

  // 답안 제출
  async submitAnswer(problemId: string, answer: {
    conditionType: 'necessary' | 'sufficient';
    isCorrect: boolean;
  }): Promise<{ correct: boolean; explanation?: string }> {
    try {
      const response = await apiClient.post<ApiResponse<{ correct: boolean; explanation?: string }>>(
        `/problems/${problemId}/answer`,
        answer
      );
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to submit answer');
    } catch (error) {
      console.error('Error submitting answer:', error);
      throw error;
    }
  },
};

export default apiClient;
