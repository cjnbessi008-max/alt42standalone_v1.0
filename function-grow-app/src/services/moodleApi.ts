import axios from 'axios';
import type { AxiosInstance } from 'axios';

export interface MoodleProblem {
  id: number;
  title: string;
  description: string;
  targetFunction: string;
  terms: Array<{
    coefficient: number;
    power: number;
  }>;
  hints?: string[];
}

export interface MoodleConfig {
  baseUrl: string;
  token: string;
}

class MoodleApiService {
  private client: AxiosInstance;
  private config: MoodleConfig | null = null;

  constructor() {
    this.client = axios.create({
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Moodle API 설정
   */
  configure(config: MoodleConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.token}`,
      },
    });
  }

  /**
   * Moodle에서 문제 정보 가져오기
   * Moodle Web Services API를 사용합니다.
   */
  async fetchProblem(problemId: number): Promise<MoodleProblem> {
    if (!this.config) {
      throw new Error('Moodle API가 설정되지 않았습니다. configure()를 먼저 호출하세요.');
    }

    try {
      // Moodle Web Services API 형식
      const response = await this.client.get('/webservice/rest/server.php', {
        params: {
          wstoken: this.config.token,
          wsfunction: 'mod_quiz_get_quiz_by_courses',
          moodlewsrestformat: 'json',
          problemid: problemId,
        },
      });

      // 응답 데이터를 우리 형식으로 변환
      return this.transformMoodleResponse(response.data);
    } catch (error) {
      console.error('Moodle API 요청 실패:', error);
      throw new Error('문제를 불러오는데 실패했습니다.');
    }
  }

  /**
   * 문제 목록 가져오기
   */
  async fetchProblems(courseId?: number): Promise<MoodleProblem[]> {
    if (!this.config) {
      throw new Error('Moodle API가 설정되지 않았습니다.');
    }

    try {
      const response = await this.client.get('/webservice/rest/server.php', {
        params: {
          wstoken: this.config.token,
          wsfunction: 'core_course_get_contents',
          moodlewsrestformat: 'json',
          courseid: courseId || 1,
        },
      });

      return response.data.map((item: any) => this.transformMoodleResponse(item));
    } catch (error) {
      console.error('Moodle API 요청 실패:', error);
      return this.getMockProblems();
    }
  }

  /**
   * 학습자의 답안 제출
   */
  async submitAnswer(problemId: number, terms: Array<{ coefficient: number; power: number }>) {
    if (!this.config) {
      throw new Error('Moodle API가 설정되지 않았습니다.');
    }

    try {
      const response = await this.client.post('/webservice/rest/server.php', {
        wstoken: this.config.token,
        wsfunction: 'mod_quiz_process_attempt',
        moodlewsrestformat: 'json',
        problemid: problemId,
        answer: JSON.stringify(terms),
      });

      return response.data;
    } catch (error) {
      console.error('답안 제출 실패:', error);
      throw new Error('답안 제출에 실패했습니다.');
    }
  }

  /**
   * Moodle 응답을 우리 형식으로 변환
   */
  private transformMoodleResponse(data: any): MoodleProblem {
    // Moodle의 데이터 구조에 맞게 변환
    return {
      id: data.id || Math.random(),
      title: data.name || data.title || '제목 없음',
      description: data.intro || data.description || '',
      targetFunction: data.targetFunction || '',
      terms: data.terms || [],
      hints: data.hints || [],
    };
  }

  /**
   * 개발/테스트용 Mock 데이터
   */
  getMockProblems(): MoodleProblem[] {
    return [
      {
        id: 1,
        title: '이차 함수 만들기',
        description: '다음 조건을 만족하는 이차 함수를 만들어보세요: 위로 볼록한 포물선',
        targetFunction: 'f(x) = -x² + 2x + 3',
        terms: [
          { coefficient: -1, power: 2 },
          { coefficient: 2, power: 1 },
          { coefficient: 3, power: 0 },
        ],
        hints: [
          '이차항의 계수가 음수이면 위로 볼록합니다',
          '일차항으로 대칭축을 조절할 수 있습니다',
        ],
      },
      {
        id: 2,
        title: '삼차 함수 탐구',
        description: 'S자 곡선 형태의 삼차 함수를 만들어보세요',
        targetFunction: 'f(x) = x³ - 3x² + 2',
        terms: [
          { coefficient: 1, power: 3 },
          { coefficient: -3, power: 2 },
          { coefficient: 2, power: 0 },
        ],
        hints: [
          '삼차항이 있으면 S자 곡선이 됩니다',
          '이차항으로 변곡점을 조절하세요',
        ],
      },
      {
        id: 3,
        title: '일차 함수',
        description: '기울기가 2이고 y절편이 1인 직선을 만드세요',
        targetFunction: 'f(x) = 2x + 1',
        terms: [
          { coefficient: 2, power: 1 },
          { coefficient: 1, power: 0 },
        ],
        hints: [
          '일차항의 계수가 기울기입니다',
          '상수항이 y절편입니다',
        ],
      },
    ];
  }

  /**
   * Mock 데이터로 문제 하나 가져오기
   */
  getMockProblem(problemId: number): MoodleProblem {
    const problems = this.getMockProblems();
    return problems.find(p => p.id === problemId) || problems[0];
  }
}

// Singleton instance
export const moodleApi = new MoodleApiService();
