import apiClient from './client';
import { Problem, SubmitAnswerRequest, SubmitAnswerResponse } from '../types';

export const problemApi = {
  // Get all problems
  async getAllProblems() {
    const response = await apiClient.get<{ success: boolean; data: Problem[] }>(
      '/problems'
    );
    return response.data.data;
  },

  // Get problem by ID
  async getProblemById(id: string, randomize = false) {
    const response = await apiClient.get<{ success: boolean; data: Problem }>(
      `/problems/${id}`,
      { params: { randomize } }
    );
    return response.data.data;
  },

  // Submit answer
  async submitAnswer(data: SubmitAnswerRequest) {
    const response = await apiClient.post<{
      success: boolean;
      data: SubmitAnswerResponse;
    }>('/answers/submit', data);
    return response.data.data;
  },

  // Get student answers
  async getStudentAnswers(studentId: string, problemId: string) {
    const response = await apiClient.get(
      `/answers/${studentId}/${problemId}`
    );
    return response.data.data;
  },
};
