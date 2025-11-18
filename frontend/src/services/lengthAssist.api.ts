// Length Assist API service

import { apiClient } from './api';
import {
  ApiResponse,
  GetProblemsRequest,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  StudentProgress,
} from '@/types/api';
import { LengthAssistProblem } from '@/types/geometry';

export const lengthAssistApi = {
  /**
   * Get list of problems for a module
   */
  async getProblems(
    params: GetProblemsRequest
  ): Promise<ApiResponse<LengthAssistProblem[]>> {
    return apiClient.get('/length-assist/problems', params);
  },

  /**
   * Get a specific problem by ID
   */
  async getProblem(
    problemId: string
  ): Promise<ApiResponse<LengthAssistProblem>> {
    return apiClient.get(`/length-assist/problems/${problemId}`);
  },

  /**
   * Submit student answer
   */
  async submitAnswer(
    data: SubmitAnswerRequest
  ): Promise<ApiResponse<SubmitAnswerResponse>> {
    return apiClient.post('/length-assist/submit', data);
  },

  /**
   * Get student progress
   */
  async getProgress(
    studentId: string,
    moduleId: string
  ): Promise<ApiResponse<StudentProgress>> {
    return apiClient.get(`/length-assist/progress/${studentId}`, { moduleId });
  },

  /**
   * Get next problem based on student performance
   */
  async getNextProblem(
    studentId: string,
    moduleId: string
  ): Promise<ApiResponse<LengthAssistProblem>> {
    return apiClient.post('/length-assist/next-problem', {
      studentId,
      moduleId,
    });
  },
};

export default lengthAssistApi;
