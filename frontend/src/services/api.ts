/**
 * API Service for ALT42 Backend
 */
import axios, { AxiosInstance } from 'axios';
import type {
  TipRequest,
  TipResponse,
  PerspectiveTip,
  LMSIntegration,
  Problem,
  Student,
  TipAnalytics,
  ApiResponse,
} from '../types';

class ApiService {
  private client: AxiosInstance;

  constructor(baseURL: string = 'http://localhost:8000') {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 요청 인터셉터 (인증 토큰 추가 등)
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 응답 인터셉터 (에러 처리)
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
      }
    );
  }

  // ===== 팁 관련 API =====

  /**
   * 맞춤 팁 추천 요청
   */
  async requestTip(request: TipRequest): Promise<TipResponse> {
    const response = await this.client.post<TipResponse>(
      '/api/tips/recommend',
      request
    );
    return response.data;
  }

  /**
   * 팁 피드백 제출
   */
  async submitTipFeedback(
    recommendationId: string,
    wasHelpful: boolean,
    feedback?: string
  ): Promise<void> {
    await this.client.post(`/api/tips/feedback/${recommendationId}`, {
      was_helpful: wasHelpful,
      student_feedback: feedback,
    });
  }

  /**
   * 문제 유형별 팁 목록 조회
   */
  async getTipsByProblemType(
    problemTypeId: string,
    perspectiveType?: string,
    tipLevel?: number
  ): Promise<PerspectiveTip[]> {
    const response = await this.client.get<PerspectiveTip[]>(
      `/api/tips/problem-type/${problemTypeId}`,
      {
        params: {
          perspective_type: perspectiveType,
          tip_level: tipLevel,
        },
      }
    );
    return response.data;
  }

  /**
   * 문제 내용 자동 분류
   */
  async classifyProblem(problemContent: string): Promise<{
    problem_type: string | null;
    confidence: number;
    message: string;
  }> {
    const response = await this.client.post('/api/tips/classify-problem', {
      problem_content: problemContent,
    });
    return response.data;
  }

  /**
   * 팁 효과성 분석
   */
  async getTipAnalytics(
    problemTypeId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<TipAnalytics> {
    const response = await this.client.get<TipAnalytics>(
      `/api/tips/analytics/${problemTypeId}`,
      {
        params: {
          date_from: dateFrom,
          date_to: dateTo,
        },
      }
    );
    return response.data;
  }

  /**
   * 학생별 팁 효과성 조회
   */
  async getStudentTipEffectiveness(
    studentId: string,
    problemTypeId?: string
  ): Promise<{
    student_id: string;
    preferred_perspective: string;
    perspective_effectiveness: Record<string, number>;
    total_tips_received: number;
    helpful_rate: number;
  }> {
    const response = await this.client.get(
      `/api/tips/student/${studentId}/effectiveness`,
      {
        params: {
          problem_type_id: problemTypeId,
        },
      }
    );
    return response.data;
  }

  // ===== LMS 연동 API =====

  /**
   * LMS 연동 설정
   */
  async createLMSIntegration(config: {
    lms_type: string;
    institution_name: string;
    api_endpoint: string;
    api_key: string;
    course_id?: string;
  }): Promise<{
    status: string;
    integration_id: string;
    connection_status: string;
    student_count: number;
    message: string;
  }> {
    const response = await this.client.post('/api/lms/integrations', config);
    return response.data;
  }

  /**
   * LMS 연동 목록 조회
   */
  async listLMSIntegrations(): Promise<LMSIntegration[]> {
    const response = await this.client.get<LMSIntegration[]>(
      '/api/lms/integrations'
    );
    return response.data;
  }

  /**
   * LMS 데이터 동기화
   */
  async syncLMSData(
    integrationId: string,
    courseId: string,
    syncStudents: boolean = true,
    syncProblems: boolean = true
  ): Promise<{
    status: string;
    synced_students: number;
    synced_problems: number;
    message: string;
  }> {
    const response = await this.client.post('/api/lms/sync', {
      lms_integration_id: integrationId,
      course_id: courseId,
      sync_students: syncStudents,
      sync_problems: syncProblems,
    });
    return response.data;
  }

  /**
   * LMS 학생 목록 조회
   */
  async getLMSStudents(
    integrationId: string,
    courseId: string
  ): Promise<Student[]> {
    const response = await this.client.get<{ students: Student[] }>(
      `/api/lms/students/${integrationId}/${courseId}`
    );
    return response.data.students;
  }

  /**
   * LMS 문제 목록 조회
   */
  async getLMSProblems(
    integrationId: string,
    courseId: string
  ): Promise<Problem[]> {
    const response = await this.client.get<{ problems: Problem[] }>(
      `/api/lms/problems/${integrationId}/${courseId}`
    );
    return response.data.problems;
  }

  /**
   * LMS에 성적 제출
   */
  async submitGradeToLMS(
    integrationId: string,
    studentId: string,
    problemId: string,
    score: number
  ): Promise<void> {
    await this.client.post('/api/lms/submit-grade', {
      integration_id: integrationId,
      student_id: studentId,
      problem_id: problemId,
      score,
    });
  }

  /**
   * LMS 문제 동기화 및 자동 분류
   */
  async syncAndClassifyProblems(
    integrationId: string,
    courseId: string
  ): Promise<{
    status: string;
    total_problems: number;
    auto_classified: number;
    manual_review_needed: number;
    problems: any[];
  }> {
    const response = await this.client.get(
      `/api/lms/problem-types/sync/${integrationId}/${courseId}`
    );
    return response.data;
  }
}

// 싱글톤 인스턴스
export const api = new ApiService(
  process.env.REACT_APP_API_URL || 'http://localhost:8000'
);

export default api;
