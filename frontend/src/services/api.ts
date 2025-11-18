/**
 * API client for Dropout Analysis
 */
import axios from 'axios';
import type {
  DropoutAnalysis,
  StudentPattern,
  ModuleAnalyticsSummary,
  DashboardData
} from '../types/dropout';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const dropoutApi = {
  /**
   * 세션의 dropout 분석 수행
   */
  analyzeSession: async (sessionId: string): Promise<DropoutAnalysis> => {
    const response = await apiClient.post(
      `/api/analytics/dropout/sessions/${sessionId}/analyze`
    );
    return response.data;
  },

  /**
   * 세션의 dropout 분석 결과 조회
   */
  getSessionAnalysis: async (sessionId: string): Promise<DropoutAnalysis> => {
    const response = await apiClient.get(
      `/api/analytics/dropout/sessions/${sessionId}`
    );
    return response.data;
  },

  /**
   * 학생의 dropout 패턴 분석
   */
  getStudentPattern: async (
    studentId: string,
    limit: number = 5
  ): Promise<StudentPattern> => {
    const response = await apiClient.get(
      `/api/analytics/dropout/students/${studentId}/pattern`,
      { params: { limit } }
    );
    return response.data;
  },

  /**
   * 모듈의 dropout 요약 분석
   */
  getModuleSummary: async (
    moduleId: string,
    days: number = 30
  ): Promise<ModuleAnalyticsSummary> => {
    const response = await apiClient.get(
      `/api/analytics/dropout/modules/${moduleId}/summary`,
      { params: { days } }
    );
    return response.data;
  },

  /**
   * Dropout 대시보드 데이터
   */
  getDashboard: async (days: number = 30): Promise<DashboardData> => {
    const response = await apiClient.get('/api/analytics/dropout/dashboard', {
      params: { days },
    });
    return response.data;
  },
};

export default apiClient;
