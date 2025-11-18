/**
 * Moodle Web Services 연동 서비스
 * Moodle 3.7 REST API와 통신
 */

import axios from 'axios';

interface MoodleQuestion {
  id: number;
  name: string;
  questiontext: string;
  questiontype: string;
  category: string;
}

interface MoodleCategory {
  id: number;
  name: string;
  parent: number;
}

class MoodleService {
  private baseUrl: string;
  private token: string;

  constructor() {
    this.baseUrl = process.env.MOODLE_URL || 'http://localhost/moodle';
    this.token = process.env.MOODLE_TOKEN || '';
  }

  /**
   * Moodle Web Service API 호출
   */
  private async callMoodleApi(wsfunction: string, params: Record<string, any> = {}) {
    try {
      const url = `${this.baseUrl}/webservice/rest/server.php`;
      const response = await axios.get(url, {
        params: {
          wstoken: this.token,
          wsfunction,
          moodlewsrestformat: 'json',
          ...params,
        },
      });

      if (response.data.exception) {
        throw new Error(response.data.message || 'Moodle API error');
      }

      return response.data;
    } catch (error) {
      console.error('Moodle API call failed:', error);
      throw error;
    }
  }

  /**
   * 문제 목록 가져오기
   */
  async getQuestions(categoryId?: number): Promise<MoodleQuestion[]> {
    try {
      // Moodle의 question bank API 사용
      const params: Record<string, any> = {};
      if (categoryId) {
        params.categoryid = categoryId;
      }

      const data = await this.callMoodleApi('core_question_get_questions', params);

      // 데모 데이터 (실제 Moodle 연결 전)
      if (!data || data.length === 0) {
        return this.getDemoQuestions();
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch questions from Moodle:', error);
      // 연결 실패 시 데모 데이터 반환
      return this.getDemoQuestions();
    }
  }

  /**
   * 특정 문제 가져오기
   */
  async getQuestion(questionId: number): Promise<MoodleQuestion | null> {
    try {
      const data = await this.callMoodleApi('core_question_get_question', {
        questionid: questionId,
      });

      return data || null;
    } catch (error) {
      console.error('Failed to fetch question from Moodle:', error);
      return null;
    }
  }

  /**
   * 카테고리 목록 가져오기
   */
  async getCategories(): Promise<MoodleCategory[]> {
    try {
      const data = await this.callMoodleApi('core_question_get_categories');

      if (!data || data.length === 0) {
        return this.getDemoCategories();
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch categories from Moodle:', error);
      return this.getDemoCategories();
    }
  }

  /**
   * 데모 문제 데이터
   */
  private getDemoQuestions(): MoodleQuestion[] {
    return [
      {
        id: 1,
        name: '삼각형 닮음 문제 1',
        questiontext: '두 삼각형이 닮음인지 확인하세요.',
        questiontype: 'similarity',
        category: 'geometry',
      },
      {
        id: 2,
        name: '삼각형 닮음 문제 2',
        questiontext: '닮음 조건을 찾아보세요.',
        questiontype: 'similarity',
        category: 'geometry',
      },
    ];
  }

  /**
   * 데모 카테고리 데이터
   */
  private getDemoCategories(): MoodleCategory[] {
    return [
      { id: 1, name: '기하학', parent: 0 },
      { id: 2, name: '닮음', parent: 1 },
      { id: 3, name: '삼각형', parent: 2 },
    ];
  }
}

export const moodleService = new MoodleService();
