import axios from 'axios';
import { MoodleActivity, Condition } from '../types';

const API_BASE_URL = '/api';

export const api = {
  // Moodle 활동 가져오기
  async getMoodleActivities(courseId: number): Promise<MoodleActivity[]> {
    const response = await axios.get(`${API_BASE_URL}/moodle/activities/${courseId}`);
    return response.data;
  },

  // 특정 활동의 조건 가져오기
  async getActivityConditions(activityId: number): Promise<Condition[]> {
    const response = await axios.get(`${API_BASE_URL}/conditions/${activityId}`);
    return response.data;
  },

  // 조건 저장
  async saveConditions(activityId: number, conditions: Condition[]): Promise<void> {
    await axios.post(`${API_BASE_URL}/conditions/${activityId}`, { conditions });
  },

  // 스캔 기록 저장
  async saveScanHistory(activityId: number, scanData: any): Promise<void> {
    await axios.post(`${API_BASE_URL}/scan-history`, {
      activityId,
      scanData,
      timestamp: new Date().toISOString()
    });
  },

  // Moodle 연결 테스트
  async testMoodleConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${API_BASE_URL}/moodle/test`);
      return response.data.success;
    } catch (error) {
      return false;
    }
  }
};
