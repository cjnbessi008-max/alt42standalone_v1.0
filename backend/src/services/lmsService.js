const axios = require('axios');

class LMSService {
  constructor() {
    this.apiUrl = process.env.LMS_API_URL;
    this.apiKey = process.env.LMS_API_KEY;
    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * LMS에서 문제 정보 가져오기
   * @param {string} problemId - 문제 ID
   * @returns {Promise<Object>} 문제 정보
   */
  async getProblem(problemId) {
    try {
      // LMS API가 설정되지 않은 경우 모의 데이터 반환
      if (!this.apiUrl) {
        return this.getMockProblem(problemId);
      }

      const response = await this.client.get(`/problems/${problemId}`);
      return response.data;
    } catch (error) {
      console.error('LMS API Error:', error.message);
      // 에러 발생 시 모의 데이터 반환
      return this.getMockProblem(problemId);
    }
  }

  /**
   * 여러 문제 가져오기
   * @param {Array<string>} problemIds - 문제 ID 배열
   * @returns {Promise<Array<Object>>} 문제 배열
   */
  async getProblems(problemIds) {
    try {
      if (!this.apiUrl) {
        return problemIds.map(id => this.getMockProblem(id));
      }

      const response = await this.client.post('/problems/batch', {
        problem_ids: problemIds
      });
      return response.data;
    } catch (error) {
      console.error('LMS API Error:', error.message);
      return problemIds.map(id => this.getMockProblem(id));
    }
  }

  /**
   * 과정/모듈의 모든 문제 가져오기
   * @param {string} moduleId - 모듈 ID
   * @returns {Promise<Array<Object>>} 문제 배열
   */
  async getProblemsByModule(moduleId) {
    try {
      if (!this.apiUrl) {
        return this.getMockProblems();
      }

      const response = await this.client.get(`/modules/${moduleId}/problems`);
      return response.data;
    } catch (error) {
      console.error('LMS API Error:', error.message);
      return this.getMockProblems();
    }
  }

  /**
   * 문제 요약 저장 (LMS에 역으로 저장)
   * @param {string} problemId - 문제 ID
   * @param {Array<string>} summary - 요약 내용
   * @returns {Promise<Object>} 저장 결과
   */
  async saveSummary(problemId, summary) {
    try {
      if (!this.apiUrl) {
        console.log('Mock: Summary saved for problem', problemId);
        return { success: true, problemId, summary };
      }

      const response = await this.client.post(`/problems/${problemId}/summary`, {
        summary: summary
      });
      return response.data;
    } catch (error) {
      console.error('LMS API Error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 모의 문제 데이터 생성
   * @param {string} problemId - 문제 ID
   * @returns {Object} 모의 문제 데이터
   */
  getMockProblem(problemId) {
    const mockProblems = {
      'prob_001': {
        id: 'prob_001',
        title: '분수의 덧셈',
        content: `철수는 피자를 먹고 있습니다. 첫 번째로 피자의 1/4을 먹었고, 두 번째로 피자의 1/3을 먹었습니다.

철수가 먹은 피자는 전체의 몇 분의 몇일까요?

조건:
- 피자는 원형이며, 8조각으로 동일하게 나누어져 있습니다
- 1/4은 2조각, 1/3은 약 2.67조각에 해당합니다
- 정확한 분수로 답을 구하세요
- 답은 기약분수로 표현하세요

힌트: 분모가 다른 분수를 더할 때는 통분이 필요합니다.`,
        difficulty: 'medium',
        subject: 'mathematics',
        grade: 4
      },
      'prob_002': {
        id: 'prob_002',
        title: '도형의 넓이',
        content: `직사각형 모양의 정원이 있습니다. 이 정원의 가로 길이는 12미터이고, 세로 길이는 8미터입니다.

정원 전체에 잔디를 심으려고 합니다. 잔디 1제곱미터당 비용이 5,000원일 때, 총 비용은 얼마입니까?

조건:
- 정원은 완벽한 직사각형 모양입니다
- 잔디는 정원 전체에 빈틈없이 심어집니다
- 추가 비용은 고려하지 않습니다

참고:
- 직사각형의 넓이 = 가로 × 세로
- 총 비용 = 넓이 × 단위당 비용`,
        difficulty: 'easy',
        subject: 'mathematics',
        grade: 3
      }
    };

    return mockProblems[problemId] || {
      id: problemId,
      title: '샘플 문제',
      content: '이것은 샘플 문제입니다. LMS API가 설정되지 않아 모의 데이터를 표시합니다.',
      difficulty: 'medium',
      subject: 'general',
      grade: 5
    };
  }

  /**
   * 여러 개의 모의 문제 반환
   * @returns {Array<Object>} 모의 문제 배열
   */
  getMockProblems() {
    return [
      this.getMockProblem('prob_001'),
      this.getMockProblem('prob_002')
    ];
  }
}

module.exports = new LMSService();
