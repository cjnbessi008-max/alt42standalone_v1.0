import axios, { AxiosInstance } from 'axios';
import { ApiResponse, ParsedProblem, ProblemWithSummary } from '../types';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    this.client = axios.create({
      baseURL: baseURL + '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(
        (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/health'
      );
      return response.data.status === 'ok';
    } catch {
      return false;
    }
  }

  // Test Moodle connection
  async testMoodleConnection(): Promise<boolean> {
    try {
      const response = await this.client.get<ApiResponse>('/moodle/test');
      return response.data.success;
    } catch {
      return false;
    }
  }

  // Test AI service connection
  async testAIConnection(): Promise<boolean> {
    try {
      const response = await this.client.get<ApiResponse>('/summary/test');
      return response.data.success;
    } catch {
      return false;
    }
  }

  // Fetch question from Moodle
  async getQuestion(questionId: number): Promise<ParsedProblem> {
    const response = await this.client.get<ApiResponse<ParsedProblem>>(
      `/moodle/question/${questionId}`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch question');
    }

    return response.data.data;
  }

  // Get question with AI summary
  async getQuestionWithSummary(questionId: number): Promise<ProblemWithSummary> {
    const response = await this.client.get<ApiResponse<ProblemWithSummary>>(
      `/summary/question/${questionId}`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch question with summary');
    }

    return response.data.data;
  }

  // Generate summary for custom text
  async generateSummary(
    questionText: string,
    equations?: string[],
    questionType?: string
  ): Promise<ProblemWithSummary> {
    const response = await this.client.post<ApiResponse<ProblemWithSummary>>(
      '/summary/generate',
      {
        questionText,
        equations,
        questionType,
      }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to generate summary');
    }

    return response.data.data;
  }
}

export const apiService = new ApiService();
