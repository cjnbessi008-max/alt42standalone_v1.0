/**
 * Moodle LMS API Integration Service
 * Connects to Moodle 3.7 (PHP 7.1.9, MySQL 5.7)
 *
 * For production: Configure Moodle web service tokens and endpoints
 */

import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { MoodleProblem, MoodleApiResponse } from '../types';

class MoodleApiService {
  private api: AxiosInstance;
  private useMockData: boolean;

  constructor(baseURL?: string, token?: string) {
    this.useMockData = !baseURL || !token;

    this.api = axios.create({
      baseURL: baseURL || 'http://localhost:3000/api', // fallback to mock server
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
  }

  /**
   * Fetch problem/question data from Moodle
   */
  async getProblem(problemId: number): Promise<MoodleApiResponse<MoodleProblem>> {
    if (this.useMockData) {
      return this.getMockProblem(problemId);
    }

    try {
      const response = await this.api.get(`/problems/${problemId}`);
      return {
        success: true,
        data: response.data,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Get list of problems by category or difficulty
   */
  async getProblems(filters?: {
    category?: string;
    difficulty?: number;
    limit?: number;
  }): Promise<MoodleApiResponse<MoodleProblem[]>> {
    if (this.useMockData) {
      return this.getMockProblems();
    }

    try {
      const response = await this.api.get('/problems', { params: filters });
      return {
        success: true,
        data: response.data,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  /**
   * Submit student answer
   */
  async submitAnswer(problemId: number, answer: any): Promise<MoodleApiResponse<{
    correct: boolean;
    feedback: string;
  }>> {
    if (this.useMockData) {
      return {
        success: true,
        data: {
          correct: Math.random() > 0.5,
          feedback: '좋은 시도입니다!'
        },
        timestamp: Date.now()
      };
    }

    try {
      const response = await this.api.post(`/problems/${problemId}/submit`, { answer });
      return {
        success: true,
        data: response.data,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  // Mock data for development
  private getMockProblem(id: number): Promise<MoodleApiResponse<MoodleProblem>> {
    const mockProblems: MoodleProblem[] = [
      {
        id: 1,
        questionText: '주사위 2개를 던질 때 나올 수 있는 경우의 수는?',
        questionType: 'combination',
        difficulty: 2,
        possibilitiesCount: 36,
        correctAnswer: 36
      },
      {
        id: 2,
        questionText: '동전 3개를 던질 때 나올 수 있는 경우의 수는?',
        questionType: 'probability',
        difficulty: 1,
        possibilitiesCount: 8,
        correctAnswer: 8
      },
      {
        id: 3,
        questionText: '4명 중 2명을 선발하는 경우의 수는? (순서 무관)',
        questionType: 'combination',
        difficulty: 3,
        possibilitiesCount: 6,
        correctAnswer: 6
      },
      {
        id: 4,
        questionText: '1부터 5까지 숫자 중 3개를 뽑아 만들 수 있는 세 자리 수는?',
        questionType: 'combination',
        difficulty: 4,
        possibilitiesCount: 60,
        correctAnswer: 60
      },
      {
        id: 5,
        questionText: 'A, B, C, D 4명이 일렬로 서는 경우의 수는?',
        questionType: 'combination',
        difficulty: 2,
        possibilitiesCount: 24,
        correctAnswer: 24
      }
    ];

    const problem = mockProblems.find(p => p.id === id) || mockProblems[0];

    return Promise.resolve({
      success: true,
      data: problem,
      timestamp: Date.now()
    });
  }

  private getMockProblems(): Promise<MoodleApiResponse<MoodleProblem[]>> {
    return this.getMockProblem(1).then(response => ({
      success: true,
      data: [1, 2, 3, 4, 5].map(id => ({
        ...(response.data as MoodleProblem),
        id
      })),
      timestamp: Date.now()
    }));
  }
}

// Export singleton instance
export const moodleApi = new MoodleApiService();

// Export class for custom instances
export default MoodleApiService;
