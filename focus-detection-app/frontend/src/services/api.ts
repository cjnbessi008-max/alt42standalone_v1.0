import axios, { AxiosInstance } from 'axios';
import { Session, FocusData, Student, ApiResponse, TeacherDashboardData } from '@/types';

class ApiService {
  private client: AxiosInstance;

  constructor(baseURL: string = '/api') {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 요청 인터셉터
    this.client.interceptors.request.use(
      (config) => {
        // 필요시 토큰 추가
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 응답 인터셉터
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API 오류:', error);
        return Promise.reject(error);
      }
    );
  }

  // 세션 관련 API
  async createSession(studentName: string): Promise<ApiResponse<Session>> {
    const response = await this.client.post<ApiResponse<Session>>('/sessions', {
      studentName,
    });
    return response.data;
  }

  async getSession(sessionId: string): Promise<ApiResponse<Session>> {
    const response = await this.client.get<ApiResponse<Session>>(`/sessions/${sessionId}`);
    return response.data;
  }

  async endSession(sessionId: string): Promise<ApiResponse<Session>> {
    const response = await this.client.post<ApiResponse<Session>>(`/sessions/${sessionId}/end`);
    return response.data;
  }

  async pauseSession(sessionId: string): Promise<ApiResponse<Session>> {
    const response = await this.client.post<ApiResponse<Session>>(`/sessions/${sessionId}/pause`);
    return response.data;
  }

  async resumeSession(sessionId: string): Promise<ApiResponse<Session>> {
    const response = await this.client.post<ApiResponse<Session>>(`/sessions/${sessionId}/resume`);
    return response.data;
  }

  // 집중도 데이터 저장
  async saveFocusData(sessionId: string, focusData: FocusData): Promise<ApiResponse<void>> {
    const response = await this.client.post<ApiResponse<void>>('/focus-data', {
      sessionId,
      ...focusData,
    });
    return response.data;
  }

  async saveFocusDataBatch(sessionId: string, focusDataList: FocusData[]): Promise<ApiResponse<void>> {
    const response = await this.client.post<ApiResponse<void>>('/focus-data/batch', {
      sessionId,
      focusDataList,
    });
    return response.data;
  }

  // 학생 관련 API
  async getStudent(studentId: string): Promise<ApiResponse<Student>> {
    const response = await this.client.get<ApiResponse<Student>>(`/students/${studentId}`);
    return response.data;
  }

  async getStudentSessions(studentName: string): Promise<ApiResponse<Session[]>> {
    const response = await this.client.get<ApiResponse<Session[]>>(`/students/${studentName}/sessions`);
    return response.data;
  }

  // 교사 대시보드 API
  async getTeacherDashboard(): Promise<ApiResponse<TeacherDashboardData>> {
    const response = await this.client.get<ApiResponse<TeacherDashboardData>>('/teacher/dashboard');
    return response.data;
  }

  async getAllSessions(limit?: number): Promise<ApiResponse<Session[]>> {
    const response = await this.client.get<ApiResponse<Session[]>>('/sessions', {
      params: { limit },
    });
    return response.data;
  }

  // 리포트 API
  async getSessionReport(sessionId: string): Promise<ApiResponse<any>> {
    const response = await this.client.get<ApiResponse<any>>(`/reports/${sessionId}`);
    return response.data;
  }

  // 통계 API
  async getStats(studentName?: string, startDate?: string, endDate?: string): Promise<ApiResponse<any>> {
    const response = await this.client.get<ApiResponse<any>>('/stats', {
      params: { studentName, startDate, endDate },
    });
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
