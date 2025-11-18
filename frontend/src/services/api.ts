/**
 * 워밍업 문제 추천 API 서비스
 */
import axios from 'axios';
import {
  WarmupRecommendationRequest,
  WarmupRecommendationResponse,
  SubmitResultResponse,
  Problem
} from '../types/problem';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * 워밍업 문제 추천 API
 */
export const warmupAPI = {
  /**
   * 워밍업 문제 추천
   */
  async recommendProblem(
    request: WarmupRecommendationRequest
  ): Promise<WarmupRecommendationResponse> {
    const response = await api.post<WarmupRecommendationResponse>(
      '/api/warmup/recommend',
      request
    );
    return response.data;
  },

  /**
   * 문제 풀이 결과 제출
   */
  async submitAnswer(
    studentId: string,
    problemId: string,
    answer: string,
    timeSpentSeconds: number
  ): Promise<SubmitResultResponse> {
    const response = await api.post<SubmitResultResponse>(
      '/api/warmup/submit',
      null,
      {
        params: {
          student_id: studentId,
          problem_id: problemId,
          answer: answer,
          time_spent_seconds: timeSpentSeconds
        }
      }
    );
    return response.data;
  },

  /**
   * 학생의 풀이 이력 조회
   */
  async getStudentHistory(studentId: string): Promise<any> {
    const response = await api.get(`/api/warmup/student/${studentId}/history`);
    return response.data;
  },

  /**
   * 워밍업 문제 목록 조회
   */
  async listProblems(
    difficulty?: string,
    subject?: string
  ): Promise<{ total: number; problems: Problem[] }> {
    const params: any = {};
    if (difficulty) params.difficulty = difficulty;
    if (subject) params.subject = subject;

    const response = await api.get('/api/warmup/problems', { params });
    return response.data;
  },

  /**
   * 특정 문제 상세 조회
   */
  async getProblemDetail(problemId: string): Promise<Problem> {
    const response = await api.get<Problem>(`/api/warmup/problems/${problemId}`);
    return response.data;
  }
};

export default warmupAPI;
