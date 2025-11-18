import axios from 'axios';
import { ProblemData, MoodleResponse } from '../types/equation';

/**
 * Moodle LMS와 통신하는 API 서비스
 */
export class MoodleAPI {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string = '', token: string = '') {
    this.baseUrl = baseUrl || import.meta.env.VITE_MOODLE_URL || '';
    this.token = token || import.meta.env.VITE_MOODLE_TOKEN || '';
  }

  /**
   * Moodle에서 문제 데이터 가져오기
   */
  async getProblem(problemId: string): Promise<MoodleResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/webservice/rest/server.php`, {
        params: {
          wstoken: this.token,
          wsfunction: 'local_equationfold_get_problem',
          moodlewsrestformat: 'json',
          problemid: problemId
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Moodle API 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  /**
   * 학생 답안 제출
   */
  async submitAnswer(problemId: string, studentAnswer: string, steps: number): Promise<MoodleResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/webservice/rest/server.php`, null, {
        params: {
          wstoken: this.token,
          wsfunction: 'local_equationfold_submit_answer',
          moodlewsrestformat: 'json',
          problemid: problemId,
          answer: studentAnswer,
          steps: steps
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('답안 제출 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  /**
   * 학습 진행상황 저장
   */
  async saveProgress(studentId: string, problemId: string, progress: any): Promise<MoodleResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/webservice/rest/server.php`, null, {
        params: {
          wstoken: this.token,
          wsfunction: 'local_equationfold_save_progress',
          moodlewsrestformat: 'json',
          studentid: studentId,
          problemid: problemId,
          progress: JSON.stringify(progress)
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('진행상황 저장 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  /**
   * URL 파라미터에서 Moodle 연동 정보 추출
   */
  static extractMoodleParams(): {
    problemId?: string;
    studentId?: string;
    token?: string;
  } {
    const params = new URLSearchParams(window.location.search);
    return {
      problemId: params.get('problemid') || undefined,
      studentId: params.get('studentid') || undefined,
      token: params.get('token') || undefined
    };
  }

  /**
   * 모의 데이터 생성 (개발/테스트용)
   */
  static getMockProblem(problemId: string): ProblemData {
    const mockProblems: { [key: string]: ProblemData } = {
      '1': {
        id: '1',
        equation: '3(x + 2) + 2(x + 3)',
        steps: [],
        difficulty: 1,
        subject: '대수학'
      },
      '2': {
        id: '2',
        equation: '2(3x + 4) - 3(x - 2)',
        steps: [],
        difficulty: 2,
        subject: '대수학'
      },
      '3': {
        id: '3',
        equation: '(x + 2)(x + 3)',
        steps: [],
        difficulty: 3,
        subject: '이차방정식'
      }
    };

    return mockProblems[problemId] || mockProblems['1'];
  }
}
