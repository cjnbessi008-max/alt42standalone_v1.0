/**
 * Moodle API 연동 서비스
 * Moodle 3.7 LMS와 통신하여 문제 정보를 가져옴
 */

import axios, { AxiosInstance } from 'axios';
import { MoodleQuestion, ProblemData, ApiResponse } from '@types/index';

class MoodleApiService {
  private axiosInstance: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 요청 인터셉터
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // 인증 토큰이 있다면 추가
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 응답 인터셉터
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Moodle에서 문제 목록 가져오기
   */
  async getQuestions(categoryId?: number): Promise<ApiResponse<MoodleQuestion[]>> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<MoodleQuestion[]>>(
        '/moodle/questions',
        {
          params: { categoryId },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      return {
        success: false,
        error: 'Failed to fetch questions from Moodle',
      };
    }
  }

  /**
   * 특정 문제 정보 가져오기
   */
  async getQuestion(questionId: number): Promise<ApiResponse<MoodleQuestion>> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<MoodleQuestion>>(
        `/moodle/questions/${questionId}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch question:', error);
      return {
        success: false,
        error: 'Failed to fetch question from Moodle',
      };
    }
  }

  /**
   * 닮음 문제 데이터 가져오기
   */
  async getSimilarityProblem(problemId: string): Promise<ApiResponse<ProblemData>> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<ProblemData>>(
        `/problems/${problemId}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch similarity problem:', error);
      return {
        success: false,
        error: 'Failed to fetch similarity problem',
      };
    }
  }

  /**
   * 문제 목록 가져오기 (로컬 서버)
   */
  async getProblems(): Promise<ApiResponse<ProblemData[]>> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<ProblemData[]>>('/problems');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch problems:', error);
      return {
        success: false,
        error: 'Failed to fetch problems',
      };
    }
  }

  /**
   * 사용자 답안 제출
   */
  async submitAnswer(
    problemId: string,
    answer: {
      selectedCondition: string | null;
      calculatedRatio?: number;
    }
  ): Promise<ApiResponse<{ correct: boolean; feedback: string }>> {
    try {
      const response = await this.axiosInstance.post<
        ApiResponse<{ correct: boolean; feedback: string }>
      >(`/problems/${problemId}/submit`, answer);
      return response.data;
    } catch (error) {
      console.error('Failed to submit answer:', error);
      return {
        success: false,
        error: 'Failed to submit answer',
      };
    }
  }

  /**
   * 학습 진행 상황 저장
   */
  async saveProgress(problemId: string, completed: boolean): Promise<ApiResponse<void>> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<void>>('/progress', {
        problemId,
        completed,
        timestamp: Date.now(),
      });
      return response.data;
    } catch (error) {
      console.error('Failed to save progress:', error);
      return {
        success: false,
        error: 'Failed to save progress',
      };
    }
  }
}

// 싱글톤 인스턴스 생성
export const moodleApi = new MoodleApiService();
