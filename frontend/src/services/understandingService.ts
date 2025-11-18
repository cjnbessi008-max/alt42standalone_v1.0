/**
 * Understanding Level Service
 * LMS와 연동하여 학습자의 이해도를 관리하는 서비스
 */

import apiClient, { ApiResponse } from './apiClient';
import {
  UnderstandingData,
  UnderstandingLevel,
  UnderstandingMetrics,
  UnderstandingHistoryEntry
} from '../types/understanding';

export interface GetUnderstandingParams {
  studentId: string;
  moduleId: string;
}

export interface UpdateUnderstandingParams extends GetUnderstandingParams {
  metrics: Partial<UnderstandingMetrics>;
}

export interface UnderstandingAnalytics {
  studentId: string;
  moduleId: string;
  currentLevel: UnderstandingLevel;
  metrics: UnderstandingMetrics;
  levelDistribution: Record<UnderstandingLevel, number>; // percentage
  timeToLevel: Record<UnderstandingLevel, number>; // days
  recommendedActions: string[];
}

class UnderstandingService {
  /**
   * 학생의 현재 이해도 수준을 조회합니다
   */
  async getUnderstandingLevel(
    params: GetUnderstandingParams
  ): Promise<UnderstandingData> {
    try {
      const response = await apiClient.get<UnderstandingData>(
        `/modules/${params.moduleId}/progress/${params.studentId}/understanding-level`
      );

      // Convert date strings to Date objects
      return {
        ...response.data,
        updatedAt: new Date(response.data.updatedAt),
        history: response.data.history?.map(entry => ({
          ...entry,
          achievedAt: new Date(entry.achievedAt)
        }))
      };
    } catch (error) {
      console.error('Failed to fetch understanding level:', error);
      throw error;
    }
  }

  /**
   * 학생의 이해도를 업데이트합니다
   */
  async updateUnderstandingLevel(
    params: UpdateUnderstandingParams
  ): Promise<UnderstandingData> {
    try {
      const response = await apiClient.post<UnderstandingData>(
        `/modules/${params.moduleId}/progress/${params.studentId}/update-understanding`,
        { metrics: params.metrics }
      );

      return {
        ...response.data,
        updatedAt: new Date(response.data.updatedAt),
        history: response.data.history?.map(entry => ({
          ...entry,
          achievedAt: new Date(entry.achievedAt)
        }))
      };
    } catch (error) {
      console.error('Failed to update understanding level:', error);
      throw error;
    }
  }

  /**
   * 이해도 수준을 계산합니다 (로컬 계산)
   */
  calculateUnderstandingLevel(metrics: UnderstandingMetrics): UnderstandingLevel {
    const { accuracy, problemsAttempted, consistencyScore } = metrics;

    // Level 3 (Mastery): 높은 정확도, 충분한 연습, 일관성
    if (
      accuracy >= 80 &&
      problemsAttempted >= 15 &&
      consistencyScore >= 70
    ) {
      return 3;
    }

    // Level 2 (Intermediate): 중간 정확도, 일정 연습
    if (
      accuracy >= 40 &&
      problemsAttempted >= 5 &&
      consistencyScore >= 40
    ) {
      return 2;
    }

    // Level 1 (Novice): 기본 수준
    return 1;
  }

  /**
   * 학생의 이해도 분석 데이터를 조회합니다
   */
  async getUnderstandingAnalytics(
    params: GetUnderstandingParams
  ): Promise<UnderstandingAnalytics> {
    try {
      const response = await apiClient.get<UnderstandingAnalytics>(
        `/modules/${params.moduleId}/analytics/understanding`,
        { studentId: params.studentId }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to fetch understanding analytics:', error);
      throw error;
    }
  }

  /**
   * 모듈 전체의 이해도 분포를 조회합니다 (교사용)
   */
  async getModuleUnderstandingDistribution(
    moduleId: string
  ): Promise<Record<UnderstandingLevel, number>> {
    try {
      const response = await apiClient.get<Record<UnderstandingLevel, number>>(
        `/modules/${moduleId}/analytics/understanding-distribution`
      );

      return response.data;
    } catch (error) {
      console.error('Failed to fetch understanding distribution:', error);
      throw error;
    }
  }

  /**
   * 이해도 히스토리를 조회합니다
   */
  async getUnderstandingHistory(
    params: GetUnderstandingParams
  ): Promise<UnderstandingHistoryEntry[]> {
    try {
      const response = await apiClient.get<UnderstandingHistoryEntry[]>(
        `/modules/${params.moduleId}/progress/${params.studentId}/understanding-history`
      );

      return response.data.map(entry => ({
        ...entry,
        achievedAt: new Date(entry.achievedAt)
      }));
    } catch (error) {
      console.error('Failed to fetch understanding history:', error);
      throw error;
    }
  }

  /**
   * Mock data for testing (LMS 연동 전 테스트용)
   */
  async getMockUnderstandingData(studentId: string, moduleId: string): Promise<UnderstandingData> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockLevel: UnderstandingLevel = Math.floor(Math.random() * 3) + 1 as UnderstandingLevel;

    return {
      level: mockLevel,
      studentId,
      moduleId,
      updatedAt: new Date(),
      history: [
        {
          level: 1,
          achievedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          trigger: 'initial_assessment'
        },
        {
          level: mockLevel,
          achievedAt: new Date(),
          trigger: 'progress_milestone'
        }
      ]
    };
  }
}

export const understandingService = new UnderstandingService();
export default understandingService;
