/**
 * LMS Integration Service
 * Moodle LMS와 연동하여 문제 정보를 받아오는 서비스
 */

import axios, { AxiosInstance } from 'axios';
import type { ProblemData } from '../types/vector';

interface LMSConfig {
  baseURL: string;
  apiKey?: string;
  timeout?: number;
}

interface MoodleQuizResponse {
  id: string;
  name: string;
  intro: string;
  questiondata: string;
  [key: string]: any;
}

class LMSService {
  private client: AxiosInstance;
  private readonly MOODLE_VERSION = '3.7';

  constructor(config: LMSConfig) {
    this.client = axios.create({
      baseURL: config.baseURL || '/api',
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
      },
    });

    // 요청 인터셉터
    this.client.interceptors.request.use(
      (config) => {
        // 토큰이 있으면 헤더에 추가
        const token = localStorage.getItem('lms_token');
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
        if (error.response?.status === 401) {
          // 인증 오류 처리
          this.handleAuthError();
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Moodle 로그인
   */
  async login(username: string, password: string): Promise<string> {
    try {
      const response = await this.client.post('/auth/login', {
        username,
        password,
      });

      const { token } = response.data;
      localStorage.setItem('lms_token', token);
      return token;
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('로그인에 실패했습니다.');
    }
  }

  /**
   * 로그아웃
   */
  logout(): void {
    localStorage.removeItem('lms_token');
  }

  /**
   * 인증 오류 처리
   */
  private handleAuthError(): void {
    this.logout();
    window.location.href = '/login';
  }

  /**
   * 문제 목록 가져오기
   */
  async getProblems(courseId: string): Promise<ProblemData[]> {
    try {
      const response = await this.client.get(`/courses/${courseId}/problems`);
      return this.transformMoodleProblems(response.data);
    } catch (error) {
      console.error('Failed to fetch problems:', error);
      throw new Error('문제를 가져오는데 실패했습니다.');
    }
  }

  /**
   * 특정 문제 가져오기
   */
  async getProblem(problemId: string): Promise<ProblemData> {
    try {
      const response = await this.client.get(`/problems/${problemId}`);
      return this.transformMoodleProblem(response.data);
    } catch (error) {
      console.error('Failed to fetch problem:', error);
      throw new Error('문제를 가져오는데 실패했습니다.');
    }
  }

  /**
   * 새로운 문제 생성 요청
   */
  async requestNewProblem(courseId: string, type: string): Promise<ProblemData> {
    try {
      const response = await this.client.post(`/courses/${courseId}/problems`, {
        type,
      });
      return this.transformMoodleProblem(response.data);
    } catch (error) {
      console.error('Failed to create problem:', error);
      throw new Error('문제 생성에 실패했습니다.');
    }
  }

  /**
   * 답안 제출
   */
  async submitAnswer(problemId: string, answer: any): Promise<{
    correct: boolean;
    feedback: string;
    score: number;
  }> {
    try {
      const response = await this.client.post(`/problems/${problemId}/submit`, {
        answer,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to submit answer:', error);
      throw new Error('답안 제출에 실패했습니다.');
    }
  }

  /**
   * 학습 진도 가져오기
   */
  async getProgress(studentId: string, courseId: string): Promise<{
    completed: number;
    total: number;
    score: number;
  }> {
    try {
      const response = await this.client.get(
        `/students/${studentId}/courses/${courseId}/progress`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch progress:', error);
      throw new Error('진도를 가져오는데 실패했습니다.');
    }
  }

  /**
   * Moodle 퀴즈 데이터를 ProblemData로 변환
   */
  private transformMoodleProblem(moodleData: MoodleQuizResponse): ProblemData {
    try {
      // Moodle의 questiondata를 파싱
      const questionData = JSON.parse(moodleData.questiondata || '{}');

      return {
        id: moodleData.id,
        title: moodleData.name,
        description: moodleData.intro,
        vectors: questionData.vectors || [],
        answer: questionData.answer,
        type: questionData.type || 'custom',
      };
    } catch (error) {
      console.error('Failed to parse Moodle data:', error);
      // 기본 문제 데이터 반환
      return {
        id: moodleData.id,
        title: moodleData.name || 'Untitled Problem',
        description: moodleData.intro || '',
        vectors: [],
        type: 'custom',
      };
    }
  }

  /**
   * 여러 Moodle 문제를 변환
   */
  private transformMoodleProblems(moodleDataList: MoodleQuizResponse[]): ProblemData[] {
    return moodleDataList.map((data) => this.transformMoodleProblem(data));
  }

  /**
   * Moodle Web Service API 호출 (직접 호출)
   */
  async callMoodleWebService(
    wsfunction: string,
    params: Record<string, any>
  ): Promise<any> {
    try {
      const response = await this.client.post('/moodle/webservice', {
        wsfunction,
        moodlewsrestformat: 'json',
        ...params,
      });
      return response.data;
    } catch (error) {
      console.error('Moodle web service call failed:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스 생성
const lmsService = new LMSService({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  apiKey: import.meta.env.VITE_API_KEY,
});

export default lmsService;
export { LMSService };
