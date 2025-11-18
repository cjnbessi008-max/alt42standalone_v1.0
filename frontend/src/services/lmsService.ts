import { LMSProblemData, FrequencyData } from '../types/frequency';

/**
 * LMS (Moodle) 연동 서비스
 * MySQL 5.7, PHP 7.1.9, Moodle 3.7 환경과 통신
 */

interface LMSConfig {
  baseUrl: string;
  apiKey?: string;
  wsToken?: string;  // Moodle Web Service Token
}

class LMSService {
  private config: LMSConfig;

  constructor(config: LMSConfig) {
    this.config = config;
  }

  /**
   * Moodle에서 문제 정보 가져오기
   * @param problemId 문제 ID
   */
  async fetchProblemData(problemId: string): Promise<LMSProblemData> {
    try {
      const url = `${this.config.baseUrl}/webservice/rest/server.php`;
      const params = new URLSearchParams({
        wstoken: this.config.wsToken || '',
        wsfunction: 'local_kaist_get_problem_data',
        moodlewsrestformat: 'json',
        problemid: problemId,
      });

      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`LMS API Error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformLMSResponse(data);
    } catch (error) {
      console.error('Failed to fetch problem data from LMS:', error);
      throw error;
    }
  }

  /**
   * Moodle 응답을 내부 형식으로 변환
   */
  private transformLMSResponse(lmsResponse: any): LMSProblemData {
    return {
      problemId: lmsResponse.id || lmsResponse.problemid,
      problemType: lmsResponse.type || 'frequency',
      frequencyData: this.parseFrequencyData(lmsResponse.data || lmsResponse.frequencydata),
      metadata: {
        title: lmsResponse.title,
        description: lmsResponse.description,
        createdAt: lmsResponse.timecreated,
        updatedAt: lmsResponse.timemodified,
      },
    };
  }

  /**
   * 도수분포 데이터 파싱
   */
  private parseFrequencyData(rawData: any): FrequencyData[] {
    if (Array.isArray(rawData)) {
      return rawData.map((item: any) => ({
        label: item.label || item.class_interval || `${item.min}-${item.max}`,
        value: parseInt(item.value || item.frequency || 0, 10),
        color: item.color,
      }));
    }

    // JSON 문자열인 경우
    if (typeof rawData === 'string') {
      try {
        const parsed = JSON.parse(rawData);
        return this.parseFrequencyData(parsed);
      } catch {
        console.error('Failed to parse frequency data');
        return [];
      }
    }

    return [];
  }

  /**
   * 학생 응답 제출
   */
  async submitAnswer(problemId: string, answer: any): Promise<boolean> {
    try {
      const url = `${this.config.baseUrl}/webservice/rest/server.php`;
      const params = new URLSearchParams({
        wstoken: this.config.wsToken || '',
        wsfunction: 'local_kaist_submit_answer',
        moodlewsrestformat: 'json',
        problemid: problemId,
        answer: JSON.stringify(answer),
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      const result = await response.json();
      return result.success || false;
    } catch (error) {
      console.error('Failed to submit answer:', error);
      return false;
    }
  }
}

/**
 * Mock LMS Service (개발/테스트용)
 */
export class MockLMSService extends LMSService {
  private mockData: Map<string, LMSProblemData> = new Map();

  constructor() {
    super({ baseUrl: 'http://localhost:3000/mock' });
    this.initializeMockData();
  }

  private initializeMockData() {
    // Mock 문제 데이터
    this.mockData.set('problem-001', {
      problemId: 'problem-001',
      problemType: 'frequency-distribution',
      frequencyData: [
        { label: '0-10', value: 5 },
        { label: '10-20', value: 12 },
        { label: '20-30', value: 18 },
        { label: '30-40', value: 25 },
        { label: '40-50', value: 15 },
        { label: '50-60', value: 8 },
      ],
      metadata: {
        title: '수학 시험 점수 분포',
        description: '전교생 수학 시험 점수의 도수분포를 나타냅니다.',
      },
    });

    this.mockData.set('problem-002', {
      problemId: 'problem-002',
      problemType: 'frequency-distribution',
      frequencyData: [
        { label: '10-20', value: 3 },
        { label: '20-30', value: 7 },
        { label: '30-40', value: 15 },
        { label: '40-50', value: 20 },
        { label: '50-60', value: 12 },
        { label: '60-70', value: 5 },
        { label: '70-80', value: 2 },
      ],
      metadata: {
        title: '키 분포도',
        description: '학급 학생들의 키 분포를 나타냅니다.',
      },
    });
  }

  async fetchProblemData(problemId: string): Promise<LMSProblemData> {
    // 실제 네트워크 지연 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 500));

    const data = this.mockData.get(problemId);
    if (!data) {
      throw new Error(`Problem ${problemId} not found`);
    }

    return data;
  }

  async submitAnswer(problemId: string, answer: any): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log(`Answer submitted for ${problemId}:`, answer);
    return true;
  }
}

// 싱글톤 인스턴스
let lmsServiceInstance: LMSService | null = null;

/**
 * LMS 서비스 인스턴스 가져오기
 */
export const getLMSService = (useMock: boolean = true): LMSService => {
  if (!lmsServiceInstance) {
    if (useMock) {
      lmsServiceInstance = new MockLMSService();
    } else {
      // 실제 Moodle 환경 설정
      const config: LMSConfig = {
        baseUrl: process.env.REACT_APP_MOODLE_URL || 'http://localhost/moodle',
        wsToken: process.env.REACT_APP_MOODLE_TOKEN || '',
      };
      lmsServiceInstance = new LMSService(config);
    }
  }
  return lmsServiceInstance;
};

export default LMSService;
