import axios, { AxiosInstance } from 'axios';
import { Problem, TreeNode, TreeCalculationResult, ApiResponse } from '../types';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || '/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
      }
    );
  }

  // Problem endpoints
  async getAllProblems(): Promise<Problem[]> {
    const response = await this.client.get<ApiResponse<Problem[]>>('/problems');
    return response.data.data || [];
  }

  async getProblemById(id: number): Promise<{ problem: Problem; treeNodes: TreeNode[] }> {
    const response = await this.client.get<ApiResponse>(`/problems/${id}`);
    return response.data.data;
  }

  async getProblemByMoodleQuizId(quizId: number): Promise<{ problem: Problem; treeNodes: TreeNode[] }> {
    const response = await this.client.get<ApiResponse>(`/problems/moodle/${quizId}`);
    return response.data.data;
  }

  async createProblem(problemData: Partial<Problem>): Promise<Problem> {
    const response = await this.client.post<ApiResponse<Problem>>('/problems', problemData);
    return response.data.data!;
  }

  // Tree endpoints
  async calculateTree(problemId: number): Promise<TreeCalculationResult> {
    const response = await this.client.post<ApiResponse<TreeCalculationResult>>('/tree/calculate', {
      problemId
    });
    return response.data.data!;
  }

  async generateTreeNodes(problemId: number, treeConfig: any): Promise<TreeNode[]> {
    const response = await this.client.post<ApiResponse>('/tree/generate', {
      problemId,
      treeConfig
    });
    return response.data.data.nodes;
  }

  // Moodle endpoints
  async testMoodleConnection(): Promise<boolean> {
    const response = await this.client.get<ApiResponse>('/moodle/test');
    return response.data.data?.connected || false;
  }

  async syncMoodleQuiz(quizId: number): Promise<{ problem: Problem }> {
    const response = await this.client.post<ApiResponse>(`/moodle/sync/${quizId}`);
    return response.data.data;
  }

  // Progress endpoints
  async saveAttempt(attemptData: {
    problemId: number;
    moodleUserId: number;
    studentName?: string;
    answer: any;
    isCorrect: boolean;
    timeSpentSeconds?: number;
    treeInteractionLog?: any;
  }): Promise<any> {
    const response = await this.client.post<ApiResponse>('/progress/attempt', attemptData);
    return response.data.data;
  }

  async getStudentProgress(userId: number, problemId: number): Promise<any> {
    const response = await this.client.get<ApiResponse>(
      `/progress/student/${userId}/problem/${problemId}`
    );
    return response.data.data;
  }
}

export default new ApiService();
