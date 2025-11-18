import axios, { AxiosInstance } from 'axios';
import {
  Problem,
  StudentSession,
  StudentAttempt,
  ApiResponse,
  InteractionData,
} from '@/types';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add any auth tokens here if needed
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
      }
    );
  }

  // Health Check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data.success;
    } catch (error) {
      return false;
    }
  }

  // Problem APIs
  async getAllProblems(filters?: {
    problem_type?: string;
    difficulty_level?: string;
    target_grade?: number;
    is_active?: boolean;
  }): Promise<Problem[]> {
    const response = await this.client.get<ApiResponse<Problem[]>>('/problems', {
      params: filters,
    });
    return response.data.data || [];
  }

  async getProblem(id: number): Promise<Problem> {
    const response = await this.client.get<ApiResponse<Problem>>(
      `/problems/${id}`
    );
    if (!response.data.data) {
      throw new Error('Problem not found');
    }
    return response.data.data;
  }

  async getRandomProblem(filters?: {
    problem_type?: string;
    difficulty_level?: string;
    target_grade?: number;
  }): Promise<Problem> {
    const response = await this.client.get<ApiResponse<Problem>>(
      '/problems/random',
      { params: filters }
    );
    if (!response.data.data) {
      throw new Error('No problems found');
    }
    return response.data.data;
  }

  async createProblem(problem: Partial<Problem>): Promise<Problem> {
    const response = await this.client.post<ApiResponse<Problem>>(
      '/problems',
      problem
    );
    if (!response.data.data) {
      throw new Error('Failed to create problem');
    }
    return response.data.data;
  }

  async updateProblem(
    id: number,
    problem: Partial<Problem>
  ): Promise<Problem> {
    const response = await this.client.put<ApiResponse<Problem>>(
      `/problems/${id}`,
      problem
    );
    if (!response.data.data) {
      throw new Error('Failed to update problem');
    }
    return response.data.data;
  }

  async deleteProblem(id: number): Promise<boolean> {
    const response = await this.client.delete<ApiResponse>(
      `/problems/${id}`
    );
    return response.data.success;
  }

  // Session APIs
  async createSession(
    student_name?: string,
    moodle_user_id?: number
  ): Promise<StudentSession> {
    const response = await this.client.post<ApiResponse<StudentSession>>(
      '/sessions',
      { student_name, moodle_user_id }
    );
    if (!response.data.data) {
      throw new Error('Failed to create session');
    }
    return response.data.data;
  }

  async getSession(session_id: string): Promise<StudentSession> {
    const response = await this.client.get<ApiResponse<StudentSession>>(
      `/sessions/${session_id}`
    );
    if (!response.data.data) {
      throw new Error('Session not found');
    }
    return response.data.data;
  }

  async submitAttempt(
    session_id: string,
    problem_id: number,
    student_answer: string,
    time_spent_seconds?: number,
    interaction_data?: InteractionData
  ): Promise<{
    attempt: StudentAttempt;
    is_correct: boolean;
    correct_answer: string;
  }> {
    const response = await this.client.post<
      ApiResponse<{
        attempt: StudentAttempt;
        is_correct: boolean;
        correct_answer: string;
      }>
    >(`/sessions/${session_id}/attempts`, {
      problem_id,
      student_answer,
      time_spent_seconds,
      interaction_data,
    });

    if (!response.data.data) {
      throw new Error('Failed to submit attempt');
    }

    return response.data.data;
  }

  async getSessionStats(session_id: string): Promise<{
    total_attempted: number;
    total_correct: number;
    accuracy: number;
    session_duration_minutes: number;
    recent_attempts: StudentAttempt[];
  }> {
    const response = await this.client.get<
      ApiResponse<{
        total_attempted: number;
        total_correct: number;
        accuracy: number;
        session_duration_minutes: number;
        recent_attempts: StudentAttempt[];
      }>
    >(`/sessions/${session_id}/stats`);

    if (!response.data.data) {
      throw new Error('Failed to fetch stats');
    }

    return response.data.data;
  }

  // Moodle Integration APIs
  async testMoodleConnection(): Promise<boolean> {
    try {
      const response = await this.client.get<ApiResponse>('/moodle/test');
      return response.data.success;
    } catch (error) {
      return false;
    }
  }

  async importMoodleQuiz(quizId: number): Promise<{
    imported: number;
    errors: number;
    problems: Problem[];
  }> {
    const response = await this.client.post<
      ApiResponse<{
        imported: number;
        errors: number;
        problems: Problem[];
      }>
    >(`/moodle/import-quiz/${quizId}`);

    if (!response.data.data) {
      throw new Error('Failed to import quiz');
    }

    return response.data.data;
  }
}

export default new ApiService();
