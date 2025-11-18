import axios, { AxiosInstance } from 'axios';
import { ProblemData, LMSResponse, UserProgress } from '../types';

/**
 * LMS API 클라이언트 (Moodle 3.7+ 연동)
 * PHP 7.1.9 + MySQL 5.7 백엔드와 통신
 */
class LMSApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    // 환경변수에서 LMS 서버 주소 가져오기
    this.baseURL = import.meta.env.VITE_LMS_API_URL || 'http://localhost:8080/api';

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
        const token = localStorage.getItem('lms_token');
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
        console.error('LMS API Error:', error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * 문제 정보 가져오기
   * @param problemId 문제 ID
   */
  async getProblem(problemId: string): Promise<ProblemData> {
    const response = await this.client.get<LMSResponse<ProblemData>>(
      `/problems/${problemId}`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error?.message || 'Failed to fetch problem');
  }

  /**
   * 모든 문제 목록 가져오기
   */
  async getProblems(type?: string): Promise<ProblemData[]> {
    const params = type ? { type } : {};
    const response = await this.client.get<LMSResponse<ProblemData[]>>(
      '/problems',
      { params }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    return [];
  }

  /**
   * 사용자 진행 상태 저장
   */
  async saveProgress(progress: Partial<UserProgress>): Promise<void> {
    const response = await this.client.post<LMSResponse<void>>(
      '/progress',
      progress
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to save progress');
    }
  }

  /**
   * 사용자 진행 상태 가져오기
   */
  async getProgress(userId: string, problemId: string): Promise<UserProgress | null> {
    const response = await this.client.get<LMSResponse<UserProgress>>(
      `/progress/${userId}/${problemId}`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    return null;
  }

  /**
   * 문제 완료 처리
   */
  async completeProblem(
    userId: string,
    problemId: string,
    score: number
  ): Promise<void> {
    await this.client.post<LMSResponse<void>>('/progress/complete', {
      userId,
      problemId,
      score,
      completedAt: Date.now(),
    });
  }
}

// 싱글톤 인스턴스
export const lmsApi = new LMSApiClient();

/**
 * Mock 데이터 (개발/테스트용)
 */
export const mockProblems: ProblemData[] = [
  {
    id: 'overlap-001',
    title: '원 겹치기 - 기초',
    type: 'overlap-sync',
    duration: 3000,
    targetOverlap: 0.5,
    difficulty: 'easy',
    instruction: '두 원이 50% 겹칠 때까지 기다려주세요.',
    shapes: [
      {
        id: 'shape-1',
        type: 'circle',
        color: '#FF6B6B',
        size: 100,
        startPosition: { x: 20, y: 50 },
        endPosition: { x: 45, y: 50 },
        opacity: 0.7,
        label: 'A',
      },
      {
        id: 'shape-2',
        type: 'circle',
        color: '#4ECDC4',
        size: 100,
        startPosition: { x: 80, y: 50 },
        endPosition: { x: 55, y: 50 },
        opacity: 0.7,
        label: 'B',
      },
    ],
  },
  {
    id: 'overlap-002',
    title: '사각형 겹치기 - 중급',
    type: 'overlap-sync',
    duration: 4000,
    targetOverlap: 0.3,
    difficulty: 'medium',
    instruction: '두 사각형이 30% 겹칠 때를 관찰하세요.',
    shapes: [
      {
        id: 'shape-1',
        type: 'square',
        color: '#FFD93D',
        size: 120,
        startPosition: { x: 15, y: 40 },
        endPosition: { x: 40, y: 50 },
        opacity: 0.6,
        label: '가',
      },
      {
        id: 'shape-2',
        type: 'square',
        color: '#6BCB77',
        size: 120,
        startPosition: { x: 85, y: 60 },
        endPosition: { x: 60, y: 50 },
        opacity: 0.6,
        label: '나',
      },
    ],
  },
  {
    id: 'overlap-003',
    title: '복잡한 도형 겹치기 - 고급',
    type: 'overlap-sync',
    duration: 5000,
    targetOverlap: 0.7,
    difficulty: 'hard',
    instruction: '세 도형이 중앙에서 만나는 것을 관찰하세요.',
    shapes: [
      {
        id: 'shape-1',
        type: 'circle',
        color: '#FF6B6B',
        size: 90,
        startPosition: { x: 10, y: 30 },
        endPosition: { x: 50, y: 50 },
        opacity: 0.5,
        label: '1',
      },
      {
        id: 'shape-2',
        type: 'square',
        color: '#4ECDC4',
        size: 90,
        startPosition: { x: 90, y: 30 },
        endPosition: { x: 50, y: 50 },
        opacity: 0.5,
        label: '2',
      },
      {
        id: 'shape-3',
        type: 'triangle',
        color: '#FFD93D',
        size: 90,
        startPosition: { x: 50, y: 90 },
        endPosition: { x: 50, y: 50 },
        opacity: 0.5,
        label: '3',
      },
    ],
  },
];

/**
 * Mock API (LMS 서버 없이 테스트용)
 */
export const mockLmsApi = {
  getProblem: async (problemId: string): Promise<ProblemData> => {
    await new Promise((resolve) => setTimeout(resolve, 500)); // 네트워크 지연 시뮬레이션
    const problem = mockProblems.find((p) => p.id === problemId);
    if (!problem) {
      throw new Error(`Problem not found: ${problemId}`);
    }
    return problem;
  },

  getProblems: async (): Promise<ProblemData[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockProblems;
  },

  saveProgress: async (progress: Partial<UserProgress>): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    console.log('Progress saved:', progress);
  },

  completeProblem: async (
    userId: string,
    problemId: string,
    score: number
  ): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    console.log('Problem completed:', { userId, problemId, score });
  },
};
