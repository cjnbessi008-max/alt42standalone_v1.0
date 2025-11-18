/**
 * Moodle API Service
 * Moodle 3.7 REST API와 연동하여 문제 정보를 가져옵니다.
 */

import axios, { AxiosInstance } from 'axios';
import { Problem, UserProgress, MoodleApiResponse } from '../types';

export class MoodleAPI {
  private api: AxiosInstance;
  private wsToken: string = '';

  constructor(baseURL: string = 'http://localhost:3001/api') {
    this.api = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 요청 인터셉터: 토큰 자동 추가
    this.api.interceptors.request.use(config => {
      if (this.wsToken) {
        config.params = {
          ...config.params,
          wstoken: this.wsToken
        };
      }
      return config;
    });
  }

  /**
   * Moodle 웹서비스 토큰 설정
   * @param token Moodle 웹서비스 토큰
   */
  public setToken(token: string): void {
    this.wsToken = token;
  }

  /**
   * 문제 목록 가져오기
   * @returns 문제 목록
   */
  public async getProblems(): Promise<Problem[]> {
    try {
      const response = await this.api.get<MoodleApiResponse<Problem[]>>('/problems');
      return response.data.data || [];
    } catch (error) {
      console.error('문제 목록 가져오기 실패:', error);
      throw error;
    }
  }

  /**
   * 특정 문제 가져오기
   * @param problemId 문제 ID
   * @returns 문제 정보
   */
  public async getProblem(problemId: number): Promise<Problem | null> {
    try {
      const response = await this.api.get<MoodleApiResponse<Problem>>(
        `/problems/${problemId}`
      );
      return response.data.data || null;
    } catch (error) {
      console.error(`문제 ${problemId} 가져오기 실패:`, error);
      throw error;
    }
  }

  /**
   * 학습 진행도 저장
   * @param progress 진행도 정보
   * @returns 저장 성공 여부
   */
  public async saveProgress(progress: UserProgress): Promise<boolean> {
    try {
      const response = await this.api.post<MoodleApiResponse<UserProgress>>(
        '/progress',
        progress
      );
      return response.data.success;
    } catch (error) {
      console.error('진행도 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자의 진행도 가져오기
   * @param userId 사용자 ID
   * @param problemId 문제 ID (선택)
   * @returns 진행도 목록
   */
  public async getProgress(
    userId: number,
    problemId?: number
  ): Promise<UserProgress[]> {
    try {
      const params: any = { user_id: userId };
      if (problemId) {
        params.problem_id = problemId;
      }

      const response = await this.api.get<MoodleApiResponse<UserProgress[]>>(
        '/progress',
        { params }
      );
      return response.data.data || [];
    } catch (error) {
      console.error('진행도 가져오기 실패:', error);
      throw error;
    }
  }

  /**
   * Moodle LMS와 동기화
   * @returns 동기화 성공 여부
   */
  public async syncWithMoodle(): Promise<boolean> {
    try {
      const response = await this.api.get<MoodleApiResponse<any>>(
        '/moodle/sync'
      );
      return response.data.success;
    } catch (error) {
      console.error('Moodle 동기화 실패:', error);
      throw error;
    }
  }

  /**
   * Moodle REST API 직접 호출 (백엔드 프록시 사용)
   * @param wsFunction 웹서비스 함수명
   * @param params 파라미터
   * @returns API 응답
   */
  public async callMoodleWebService(
    wsFunction: string,
    params: Record<string, any> = {}
  ): Promise<any> {
    try {
      const response = await this.api.post<MoodleApiResponse<any>>(
        '/moodle/webservice',
        {
          wsfunction: wsFunction,
          ...params
        }
      );
      return response.data.data;
    } catch (error) {
      console.error(`Moodle 웹서비스 호출 실패 (${wsFunction}):`, error);
      throw error;
    }
  }

  /**
   * Moodle 퀴즈 목록 가져오기
   * @param courseId 코스 ID
   * @returns 퀴즈 목록
   */
  public async getMoodleQuizzes(courseId: number): Promise<any[]> {
    return await this.callMoodleWebService('mod_quiz_get_quizzes_by_courses', {
      courseids: [courseId]
    });
  }

  /**
   * Moodle 코스 컨텐츠 가져오기
   * @param courseId 코스 ID
   * @returns 코스 컨텐츠
   */
  public async getMoodleCourseContents(courseId: number): Promise<any[]> {
    return await this.callMoodleWebService('core_course_get_contents', {
      courseid: courseId
    });
  }
}

// 싱글톤 인스턴스
export const moodleAPI = new MoodleAPI();
