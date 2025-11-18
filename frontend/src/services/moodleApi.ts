import axios, { AxiosInstance } from 'axios';
import type { MoodleModule, MoodleQuestion } from '@types/index';

/**
 * Moodle LMS API Service
 * PHP 7.1.9, MySQL 5.7, Moodle 3.7 호환
 */
class MoodleApiService {
  private api: AxiosInstance;
  private wstoken: string;
  private baseUrl: string;

  constructor(baseUrl: string, wstoken?: string) {
    this.baseUrl = baseUrl;
    this.wstoken = wstoken || '';

    this.api = axios.create({
      baseURL: `${baseUrl}/webservice/rest/server.php`,
      params: {
        moodlewsrestformat: 'json',
      },
    });
  }

  /**
   * 토큰 설정
   */
  setToken(token: string) {
    this.wstoken = token;
  }

  /**
   * Moodle Web Service 호출
   */
  private async callWebService<T>(
    wsfunction: string,
    params: Record<string, any> = {}
  ): Promise<T> {
    try {
      const response = await this.api.get<T>('', {
        params: {
          wstoken: this.wstoken,
          wsfunction,
          ...params,
        },
      });

      return response.data;
    } catch (error) {
      console.error(`Moodle API Error (${wsfunction}):`, error);
      throw error;
    }
  }

  /**
   * 퀴즈 모듈 정보 가져오기
   */
  async getQuizModule(quizId: number): Promise<MoodleModule> {
    const data = await this.callWebService<any>('mod_quiz_get_quizzes_by_courses', {
      courseids: [0], // 0 = all courses user is enrolled in
    });

    const quiz = data.quizzes?.find((q: any) => q.id === quizId);
    if (!quiz) {
      throw new Error(`Quiz ${quizId} not found`);
    }

    return {
      id: quiz.id,
      course: quiz.course,
      name: quiz.name,
      intro: quiz.intro,
    };
  }

  /**
   * 퀴즈 문제 목록 가져오기
   */
  async getQuizQuestions(quizId: number): Promise<MoodleQuestion[]> {
    const data = await this.callWebService<any>('mod_quiz_get_quiz_questions', {
      quizid: quizId,
    });

    return (data.questions || []).map((q: any) => ({
      id: q.id,
      name: q.name,
      questiontext: q.questiontext,
      questiontype: q.qtype,
      category: q.category,
      difficulty: this.estimateDifficulty(q),
      conceptTags: this.extractConceptTags(q),
    }));
  }

  /**
   * 문제 난이도 추정 (메타데이터 기반)
   */
  private estimateDifficulty(question: any): number {
    // Moodle 3.7에서는 난이도 메타데이터가 없을 수 있음
    // 문제 유형, 답변 선택지 수 등으로 추정
    const typeComplexity: Record<string, number> = {
      truefalse: 1,
      multichoice: 2,
      shortanswer: 3,
      numerical: 3,
      essay: 4,
      calculated: 5,
    };

    return typeComplexity[question.qtype] || 3;
  }

  /**
   * 개념 태그 추출
   */
  private extractConceptTags(question: any): string[] {
    const tags: string[] = [];

    // Moodle 태그 시스템에서 추출
    if (question.tags) {
      tags.push(...question.tags.map((t: any) => t.rawname || t.name));
    }

    // 카테고리 이름에서 개념 추출
    if (question.category) {
      const categoryName = question.category.split('/').pop() || '';
      tags.push(categoryName);
    }

    return tags;
  }

  /**
   * 학생의 퀴즈 시도 기록 가져오기
   */
  async getStudentAttempts(quizId: number, studentId: number) {
    const data = await this.callWebService<any>('mod_quiz_get_user_attempts', {
      quizid: quizId,
      userid: studentId,
    });

    return data.attempts || [];
  }

  /**
   * 학생의 문제별 정답률 분석
   */
  async analyzeStudentPerformance(quizId: number, studentId: number) {
    const attempts = await this.getStudentAttempts(quizId, studentId);

    const conceptMastery: Record<string, number> = {};

    attempts.forEach((attempt: any) => {
      // 각 문제별 정답 여부 분석
      // (실제 구현 시 mod_quiz_get_attempt_review 사용)
    });

    return conceptMastery;
  }
}

// 싱글톤 인스턴스
let moodleApiInstance: MoodleApiService | null = null;

export function initMoodleApi(baseUrl: string, wstoken?: string): MoodleApiService {
  if (!moodleApiInstance) {
    moodleApiInstance = new MoodleApiService(baseUrl, wstoken);
  }
  return moodleApiInstance;
}

export function getMoodleApi(): MoodleApiService {
  if (!moodleApiInstance) {
    throw new Error('MoodleApiService not initialized. Call initMoodleApi() first.');
  }
  return moodleApiInstance;
}

export default MoodleApiService;
