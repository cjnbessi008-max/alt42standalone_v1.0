/**
 * API Client for Learning Stress Indicator
 * 학습 스트레스 지표 API 클라이언트
 */

import { StressIndicator, StressMetrics, LearningActivity } from './types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class StressIndicatorAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * 학습 활동 데이터로부터 스트레스 지표를 계산합니다.
   */
  async calculateStress(activity: LearningActivity): Promise<StressIndicator> {
    const response = await fetch(`${this.baseUrl}/api/stress/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(activity),
    });

    if (!response.ok) {
      throw new Error(`스트레스 계산 실패: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 특정 학생의 스트레스 지표를 조회합니다.
   */
  async getStudentStressIndicators(
    studentId: string,
    moduleId?: string,
    limit: number = 10
  ): Promise<StressIndicator[]> {
    const params = new URLSearchParams();
    if (moduleId) params.append('module_id', moduleId);
    params.append('limit', limit.toString());

    const response = await fetch(
      `${this.baseUrl}/api/stress/indicator/${studentId}?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`스트레스 지표 조회 실패: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 특정 모듈의 스트레스 지표를 조회합니다.
   */
  async getModuleStressIndicators(
    moduleId: string,
    stressLevel?: string,
    limit: number = 50
  ): Promise<StressIndicator[]> {
    const params = new URLSearchParams();
    if (stressLevel) params.append('stress_level', stressLevel);
    params.append('limit', limit.toString());

    const response = await fetch(
      `${this.baseUrl}/api/stress/module/${moduleId}?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`모듈 스트레스 지표 조회 실패: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 스트레스 메트릭 통계를 조회합니다.
   */
  async getStressMetrics(
    moduleId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<StressMetrics> {
    const params = new URLSearchParams();
    if (moduleId) params.append('module_id', moduleId);
    if (startDate) params.append('start_date', startDate.toISOString());
    if (endDate) params.append('end_date', endDate.toISOString());

    const response = await fetch(
      `${this.baseUrl}/api/stress/metrics?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`스트레스 메트릭 조회 실패: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 헬스 체크
   */
  async healthCheck(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/health`);

    if (!response.ok) {
      throw new Error('API 서버 연결 실패');
    }

    return response.json();
  }
}

export const stressAPI = new StressIndicatorAPI();
export default stressAPI;
