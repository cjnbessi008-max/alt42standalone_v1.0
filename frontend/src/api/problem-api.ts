/**
 * Moodle 백엔드 API 통신
 */

import { ApiResponse, ProblemData } from '../types/problem';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost/alt42standalone_v1.0/backend/api';

export class ProblemAPI {
  /**
   * Moodle 퀴즈 문제 가져오기
   */
  static async getQuizProblem(quizId: number): Promise<ProblemData | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/get-problem.php?quiz_id=${quizId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse = await response.json();

      if (result.success && result.data) {
        return result.data;
      }

      console.error('API Error:', result.error);
      return null;
    } catch (error) {
      console.error('Failed to fetch quiz problem:', error);
      return null;
    }
  }

  /**
   * 커스텀 문제 가져오기
   */
  static async getCustomProblem(customId: number): Promise<ProblemData | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/get-problem.php?custom_id=${customId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse = await response.json();

      if (result.success && result.data) {
        return result.data;
      }

      console.error('API Error:', result.error);
      return null;
    } catch (error) {
      console.error('Failed to fetch custom problem:', error);
      return null;
    }
  }

  /**
   * 샘플 데모 문제 가져오기 (파라미터 없음)
   */
  static async getSampleProblem(): Promise<ProblemData | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/get-problem.php`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse = await response.json();

      if (result.success && result.data) {
        return result.data;
      }

      console.error('API Error:', result.error);
      return null;
    } catch (error) {
      console.error('Failed to fetch sample problem:', error);

      // API 연결 실패 시 로컬 fallback 데이터
      return {
        id: 0,
        question_name: 'Demo: Reciprocal Function',
        function: '1/x',
        asymptotes: {
          vertical: [0],
          horizontal: [0],
          oblique: []
        },
        domain: [-10, 10],
        range: [-10, 10],
        animation_duration: 2000
      };
    }
  }
}
