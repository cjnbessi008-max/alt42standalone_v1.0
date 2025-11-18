import axios, { AxiosInstance } from 'axios';
import { MoodleQuiz, CorrelationData, ApiResponse } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${API_URL}/api`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        console.error('[API Error]', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${API_URL}/health`);
      return response.data.success;
    } catch (error) {
      return false;
    }
  }

  // Moodle API methods
  async getQuizzes(): Promise<MoodleQuiz[]> {
    const response = await this.api.get<ApiResponse<MoodleQuiz[]>>('/moodle/quizzes');
    return response.data.data || [];
  }

  async getQuizById(quizId: number): Promise<MoodleQuiz | null> {
    const response = await this.api.get<ApiResponse<MoodleQuiz>>(`/moodle/quizzes/${quizId}`);
    return response.data.data || null;
  }

  // Correlation API methods
  async getCorrelationData(quizId: number): Promise<CorrelationData> {
    const response = await this.api.get<ApiResponse<CorrelationData>>(`/correlation/${quizId}`);
    if (!response.data.data) {
      throw new Error('No correlation data received');
    }
    return response.data.data;
  }

  async getTopCorrelations(quizId: number, limit: number = 10): Promise<any> {
    const response = await this.api.get<ApiResponse<any>>(`/correlation/${quizId}/top`, {
      params: { limit }
    });
    return response.data.data;
  }
}

export default new ApiService();
