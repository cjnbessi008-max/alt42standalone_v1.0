/**
 * Moodle API Client
 *
 * Moodle LMS와 통신하기 위한 API 클라이언트
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  MoodleResponse,
  CurrentConceptResponse,
  UpdateProgressResponse,
  ConceptShape,
} from '@types/shape.types';

class MoodleAPIClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = '/local/shape_morph/api') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 요청 인터셉터
    this.client.interceptors.request.use(
      (config) => {
        console.log('[Moodle API] Request:', config.method?.toUpperCase(), config.url);
        return config;
      },
      (error) => {
        console.error('[Moodle API] Request error:', error);
        return Promise.reject(error);
      }
    );

    // 응답 인터셉터
    this.client.interceptors.response.use(
      (response) => {
        console.log('[Moodle API] Response:', response.status, response.data);
        return response;
      },
      (error: AxiosError) => {
        console.error('[Moodle API] Response error:', error.response?.status, error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * 문제의 개념 정보 가져오기
   */
  async getProblemConcept(questionId: number): Promise<ConceptShape> {
    try {
      const response = await this.client.get<MoodleResponse<{ shape: ConceptShape }>>(
        '/problem-provider.php',
        {
          params: {
            action: 'get_problem_concept',
            questionid: questionId,
          },
        }
      );

      if (response.data.success && response.data.data) {
        return response.data.data.shape;
      }

      throw new Error('Failed to get problem concept');
    } catch (error) {
      console.error('Error getting problem concept:', error);
      throw error;
    }
  }

  /**
   * 현재 학생의 개념 상태 가져오기
   */
  async getCurrentConcept(courseId: number): Promise<CurrentConceptResponse> {
    try {
      const response = await this.client.get<MoodleResponse<CurrentConceptResponse>>(
        '/problem-provider.php',
        {
          params: {
            action: 'get_current_concept',
            courseid: courseId,
          },
        }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error('Failed to get current concept');
    } catch (error) {
      console.error('Error getting current concept:', error);
      throw error;
    }
  }

  /**
   * 학생 진행 상황 업데이트
   */
  async updateProgress(
    courseId: number,
    conceptId: number
  ): Promise<UpdateProgressResponse> {
    try {
      const response = await this.client.post<MoodleResponse<UpdateProgressResponse>>(
        '/problem-provider.php',
        null,
        {
          params: {
            action: 'update_progress',
            courseid: courseId,
            conceptid: conceptId,
          },
        }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error('Failed to update progress');
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  }

  /**
   * 모든 개념 가져오기
   */
  async getAllConcepts(category?: string): Promise<ConceptShape[]> {
    try {
      const response = await this.client.get<
        MoodleResponse<{ concepts: ConceptShape[] }>
      >('/problem-provider.php', {
        params: {
          action: 'get_all_concepts',
          ...(category && { category }),
        },
      });

      if (response.data.success && response.data.data) {
        return response.data.data.concepts;
      }

      throw new Error('Failed to get all concepts');
    } catch (error) {
      console.error('Error getting all concepts:', error);
      throw error;
    }
  }

  /**
   * 애니메이션 완료 이벤트 로그
   */
  async logAnimationComplete(
    courseId: number,
    fromConceptId: number,
    toConceptId: number,
    duration: number
  ): Promise<void> {
    try {
      // 이벤트 로깅은 백그라운드로 처리
      this.client.post('/event-logger.php', {
        course_id: courseId,
        event_type: 'transition_complete',
        from_concept: fromConceptId,
        to_concept: toConceptId,
        duration_ms: duration,
      }).catch(err => {
        console.warn('Failed to log animation event:', err);
      });
    } catch (error) {
      // 로깅 실패는 무시
      console.warn('Error logging animation complete:', error);
    }
  }
}

// 싱글톤 인스턴스
let moodleAPIInstance: MoodleAPIClient | null = null;

/**
 * Moodle API 클라이언트 인스턴스 가져오기
 */
export function getMoodleAPI(baseURL?: string): MoodleAPIClient {
  if (!moodleAPIInstance) {
    moodleAPIInstance = new MoodleAPIClient(baseURL);
  }
  return moodleAPIInstance;
}

export default getMoodleAPI();
