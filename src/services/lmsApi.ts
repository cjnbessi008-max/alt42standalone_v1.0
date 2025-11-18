import axios, { AxiosInstance } from 'axios';
import { ProblemData, LMSResponse, LogProperty } from '../types';

/**
 * LMS API Service
 * Moodle LMS와의 연동을 위한 API 서비스
 */
class LMSApiService {
  private client: AxiosInstance;
  private baseURL: string;
  private token: string | null;

  constructor(baseURL: string = 'http://localhost/moodle') {
    this.baseURL = baseURL;
    this.token = null;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Moodle 웹 서비스 토큰 설정
   */
  setToken(token: string): void {
    this.token = token;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Moodle에서 문제 데이터 가져오기
   * @param problemId - 문제 ID
   */
  async fetchProblemData(problemId: number): Promise<LMSResponse> {
    try {
      const response = await this.client.get(`/webservice/rest/server.php`, {
        params: {
          wstoken: this.token,
          wsfunction: 'mod_quiz_get_quiz_data',
          moodlewsrestformat: 'json',
          quizid: problemId,
        },
      });

      // Moodle 응답을 앱 형식으로 변환
      const problemData: ProblemData = this.transformMoodleData(response.data);

      return {
        success: true,
        data: problemData,
      };
    } catch (error) {
      console.error('LMS API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Moodle 데이터를 앱 형식으로 변환
   */
  private transformMoodleData(moodleData: any): ProblemData {
    // Moodle 퀴즈 데이터를 Property Flip 형식으로 변환
    // 실제 Moodle API 응답 구조에 맞게 조정 필요
    return {
      id: moodleData.id || 0,
      type: 'logarithm-property',
      properties: moodleData.questions?.map((q: any) => ({
        id: q.id,
        title: q.name || '로그 성질',
        formula: q.questiontext || '',
        explanation: q.generalfeedback || '',
        example: q.example || '',
        category: this.inferCategory(q.questiontext),
      })) || [],
      difficulty: moodleData.difficulty || 'medium',
      source: 'moodle',
    };
  }

  /**
   * 문제 내용으로부터 카테고리 추론
   */
  private inferCategory(text: string): LogProperty['category'] {
    if (text.includes('곱') || text.includes('product')) return 'basic';
    if (text.includes('밑') || text.includes('base')) return 'change-of-base';
    if (text.includes('지수') || text.includes('exponential')) return 'exponential';
    return 'advanced';
  }

  /**
   * 학습 진행 상황을 Moodle에 전송
   */
  async submitProgress(userId: number, quizId: number, progress: number): Promise<LMSResponse> {
    try {
      const response = await this.client.post(`/webservice/rest/server.php`, null, {
        params: {
          wstoken: this.token,
          wsfunction: 'mod_quiz_submit_progress',
          moodlewsrestformat: 'json',
          userid: userId,
          quizid: quizId,
          progress: progress,
        },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Progress submit error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * LMS 연결 테스트
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get(`/webservice/rest/server.php`, {
        params: {
          wstoken: this.token,
          wsfunction: 'core_webservice_get_site_info',
          moodlewsrestformat: 'json',
        },
      });
      return response.status === 200;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Mock 데이터 가져오기 (개발/테스트용)
   */
  async fetchMockProblemData(): Promise<LMSResponse> {
    // 실제 LMS 없이 테스트할 수 있도록 Mock 데이터 반환
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            id: 1,
            type: 'logarithm-property',
            properties: [], // logProperties에서 가져옴
            difficulty: 'medium',
            source: 'custom',
          },
        });
      }, 500);
    });
  }
}

// 싱글톤 인스턴스 생성
const lmsApi = new LMSApiService();

export default lmsApi;
