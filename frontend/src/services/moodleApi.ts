/**
 * Unfolding Net Live - Moodle API Service
 * Moodle LMS와의 통신을 위한 API 서비스
 */

import axios, { AxiosInstance } from 'axios';
import {
  UnfoldingProblem,
  MoodleResponse,
  ProblemRequestParams,
  PolyhedronType,
} from '../types/geometry';

class MoodleApiService {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    // 환경변수 또는 기본값 사용
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 요청 인터셉터 - 인증 토큰 추가
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('moodle_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 응답 인터셉터 - 에러 처리
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * 문제 정보 가져오기
   */
  async getProblem(params: ProblemRequestParams): Promise<UnfoldingProblem> {
    try {
      const response = await this.client.get<MoodleResponse<UnfoldingProblem>>(
        '/problems',
        { params }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to fetch problem');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error fetching problem:', error);
      // 개발 중에는 더미 데이터 반환
      return this.getDummyProblem();
    }
  }

  /**
   * 문제 목록 가져오기
   */
  async getProblems(courseId: string): Promise<UnfoldingProblem[]> {
    try {
      const response = await this.client.get<MoodleResponse<UnfoldingProblem[]>>(
        `/courses/${courseId}/problems`
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to fetch problems');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error fetching problems:', error);
      return [this.getDummyProblem()];
    }
  }

  /**
   * 학생 진행 상황 저장
   */
  async saveProgress(
    problemId: string,
    progress: number,
    interactionData: any
  ): Promise<boolean> {
    try {
      const response = await this.client.post<MoodleResponse<boolean>>(
        '/progress',
        {
          problemId,
          progress,
          interactionData,
          timestamp: Date.now(),
        }
      );

      return response.data.success;
    } catch (error) {
      console.error('Error saving progress:', error);
      return false;
    }
  }

  /**
   * 사용자 인증
   */
  async authenticate(username: string, password: string): Promise<string | null> {
    try {
      const response = await this.client.post<MoodleResponse<{ token: string }>>(
        '/auth/login',
        { username, password }
      );

      if (response.data.success && response.data.data?.token) {
        const token = response.data.data.token;
        localStorage.setItem('moodle_token', token);
        return token;
      }

      return null;
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }

  /**
   * 개발용 더미 데이터
   */
  private getDummyProblem(): UnfoldingProblem {
    return {
      id: 'dummy-1',
      type: PolyhedronType.CUBE,
      difficulty: 1,
      title: '정육면체 전개도',
      description: '정육면체를 펼쳐서 전개도를 관찰해보세요.',
      initialViewAngle: {
        azimuth: 45,
        polar: 30,
      },
    };
  }
}

// 싱글톤 인스턴스 export
export const moodleApi = new MoodleApiService();
