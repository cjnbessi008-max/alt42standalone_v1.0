import { ProblemData, LMSConfig } from '../types/integration';

/**
 * LMS 연동 서비스
 * PHP/Moodle 백엔드와 REST API로 통신
 */
export class LMSConnector {
  private config: LMSConfig;

  constructor(config: LMSConfig) {
    this.config = config;
  }

  /**
   * 문제 정보 가져오기
   * GET /api/problems/:id
   */
  async fetchProblem(problemId: string): Promise<ProblemData> {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/problems/${problemId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch problem: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('LMS fetch error:', error);
      // Fallback to mock data
      return this.getMockProblem(problemId);
    }
  }

  /**
   * 학생 답안 제출
   * POST /api/submissions
   */
  async submitAnswer(problemId: string, answer: number, method: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiEndpoint}/submissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: this.config.userId,
          problemId,
          answer,
          method,
          timestamp: new Date().toISOString()
        })
      });

      return response.ok;
    } catch (error) {
      console.error('LMS submit error:', error);
      return false;
    }
  }

  /**
   * Mock 데이터 (개발/테스트용)
   */
  private getMockProblem(problemId: string): ProblemData {
    const mockProblems: Record<string, ProblemData> = {
      '1': {
        id: '1',
        functionExpression: 'x**2',
        lowerBound: 0,
        upperBound: 2,
        exactValue: 8 / 3,
        difficulty: 'easy'
      },
      '2': {
        id: '2',
        functionExpression: 'Math.sin(x)',
        lowerBound: 0,
        upperBound: Math.PI,
        exactValue: 2,
        difficulty: 'medium'
      },
      '3': {
        id: '3',
        functionExpression: 'Math.exp(-x**2)',
        lowerBound: -2,
        upperBound: 2,
        difficulty: 'hard'
      }
    };

    return mockProblems[problemId] || mockProblems['1'];
  }
}

/**
 * Mock LMS Connector (개발용)
 */
export function createMockLMSConnector(): LMSConnector {
  return new LMSConnector({
    apiEndpoint: '/api/mock',
    apiKey: 'mock-key',
    moodleVersion: '3.7',
    userId: 'student-001'
  });
}

/**
 * 실제 Moodle LMS Connector
 * PHP 백엔드 연동 시 사용
 */
export function createMoodleLMSConnector(
  moodleUrl: string,
  apiKey: string,
  userId: string
): LMSConnector {
  return new LMSConnector({
    apiEndpoint: `${moodleUrl}/webservice/rest/server.php`,
    apiKey,
    moodleVersion: '3.7',
    userId
  });
}
