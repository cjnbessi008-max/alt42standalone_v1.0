/**
 * Moodle REST API Client
 *
 * Moodle 3.7 Web Services API와 통신하는 클라이언트
 *
 * 필요한 Moodle Web Service Functions:
 * - core_course_get_courses
 * - core_enrol_get_enrolled_users
 * - mod_quiz_get_quizzes_by_courses
 * - mod_quiz_get_user_attempts
 * - mod_quiz_get_attempt_data
 * - core_user_get_users
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '../utils/logger';

export interface MoodleConfig {
  url: string;
  token: string;
  timeout?: number;
}

export interface MoodleCourse {
  id: number;
  fullname: string;
  shortname: string;
  categoryid: number;
  summary: string;
  visible: number;
}

export interface MoodleUser {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  department?: string;
  institution?: string;
}

export interface MoodleQuiz {
  id: number;
  course: number;
  coursemodule: number;
  name: string;
  intro: string;
  timeopen: number;
  timeclose: number;
  timelimit: number;
  preferredbehaviour: string;
  attempts: number;
  grademethod: number;
  sumgrades: number;
  grade: number;
}

export interface MoodleQuizAttempt {
  id: number;
  quiz: number;
  userid: number;
  attempt: number;
  sumgrades: number;
  timestart: number;
  timefinish: number;
  timemodified: number;
  state: 'inprogress' | 'finished' | 'abandoned' | 'overdue';
}

export interface MoodleQuestion {
  slot: number;
  type: string;
  page: number;
  html: string;
  sequencecheck: number;
  lastactiontime: number;
  hasautosavedstep: boolean;
  flagged: boolean;
  number: number;
  state: string;
  status: string;
  blockedbyprevious: boolean;
  mark: string;
  maxmark: number;
}

export interface MoodleAttemptData {
  attempt: MoodleQuizAttempt;
  questions: MoodleQuestion[];
  additionaldata?: any[];
}

export class MoodleAPIClient {
  private client: AxiosInstance;
  private config: MoodleConfig;

  constructor(config: MoodleConfig) {
    this.config = {
      ...config,
      timeout: config.timeout || 30000,
    };

    this.client = axios.create({
      baseURL: `${this.config.url}/webservice/rest/server.php`,
      timeout: this.config.timeout,
      params: {
        moodlewsrestformat: 'json',
        wstoken: this.config.token,
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`Moodle API Request: ${config.params?.wsfunction}`);
        return config;
      },
      (error) => {
        logger.error('Moodle API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        // Moodle returns errors in response body with 200 status
        if (response.data?.exception) {
          throw new Error(response.data.message || 'Moodle API Error');
        }
        return response;
      },
      (error: AxiosError) => {
        logger.error('Moodle API Response Error:', error.message);
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): Error {
    if (error.response) {
      const data: any = error.response.data;
      return new Error(
        data?.message || data?.debuginfo || 'Moodle API Error'
      );
    } else if (error.request) {
      return new Error('No response from Moodle server');
    }
    return error;
  }

  /**
   * 모든 코스 가져오기
   */
  async getCourses(): Promise<MoodleCourse[]> {
    try {
      const response = await this.client.get('', {
        params: {
          wsfunction: 'core_course_get_courses',
        },
      });
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch courses:', error);
      throw error;
    }
  }

  /**
   * 특정 코스의 등록된 사용자 가져오기
   */
  async getEnrolledUsers(courseId: number): Promise<MoodleUser[]> {
    try {
      const response = await this.client.get('', {
        params: {
          wsfunction: 'core_enrol_get_enrolled_users',
          'courseid': courseId,
        },
      });
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch enrolled users for course ${courseId}:`, error);
      throw error;
    }
  }

  /**
   * 코스의 모든 퀴즈 가져오기
   */
  async getQuizzesByCourses(courseIds: number[]): Promise<MoodleQuiz[]> {
    try {
      const response = await this.client.get('', {
        params: {
          wsfunction: 'mod_quiz_get_quizzes_by_courses',
          'courseids[0]': courseIds.length > 0 ? courseIds[0] : undefined,
          ...courseIds.slice(1).reduce((acc, id, idx) => {
            acc[`courseids[${idx + 1}]`] = id;
            return acc;
          }, {} as Record<string, number>),
        },
      });
      return response.data.quizzes || [];
    } catch (error) {
      logger.error('Failed to fetch quizzes:', error);
      throw error;
    }
  }

  /**
   * 사용자의 퀴즈 시도 가져오기
   */
  async getUserAttempts(
    quizId: number,
    userId?: number,
    status: 'all' | 'finished' | 'unfinished' = 'all'
  ): Promise<MoodleQuizAttempt[]> {
    try {
      const params: any = {
        wsfunction: 'mod_quiz_get_user_attempts',
        quizid: quizId,
        status,
      };

      if (userId) {
        params.userid = userId;
      }

      const response = await this.client.get('', { params });
      return response.data.attempts || [];
    } catch (error) {
      logger.error(`Failed to fetch user attempts for quiz ${quizId}:`, error);
      throw error;
    }
  }

  /**
   * 특정 시도의 상세 데이터 가져오기
   */
  async getAttemptData(attemptId: number, page: number = -1): Promise<MoodleAttemptData> {
    try {
      const response = await this.client.get('', {
        params: {
          wsfunction: 'mod_quiz_get_attempt_data',
          attemptid: attemptId,
          page,
        },
      });
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch attempt data for attempt ${attemptId}:`, error);
      throw error;
    }
  }

  /**
   * 사용자 정보 가져오기
   */
  async getUsers(userIds: number[]): Promise<MoodleUser[]> {
    try {
      const params: any = {
        wsfunction: 'core_user_get_users',
        'criteria[0][key]': 'id',
        'criteria[0][value]': userIds.join(','),
      };

      const response = await this.client.get('', { params });
      return response.data.users || [];
    } catch (error) {
      logger.error('Failed to fetch users:', error);
      throw error;
    }
  }

  /**
   * 사용자명으로 사용자 정보 가져오기
   */
  async getUsersByField(
    field: 'id' | 'username' | 'email',
    values: string[]
  ): Promise<MoodleUser[]> {
    try {
      const params: any = {
        wsfunction: 'core_user_get_users_by_field',
        field,
        ...values.reduce((acc, value, idx) => {
          acc[`values[${idx}]`] = value;
          return acc;
        }, {} as Record<string, string>),
      };

      const response = await this.client.get('', { params });
      return response.data || [];
    } catch (error) {
      logger.error(`Failed to fetch users by ${field}:`, error);
      throw error;
    }
  }

  /**
   * 연결 테스트
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getCourses();
      logger.info('Moodle connection test successful');
      return true;
    } catch (error) {
      logger.error('Moodle connection test failed:', error);
      return false;
    }
  }
}

/**
 * 싱글톤 인스턴스
 */
let moodleClient: MoodleAPIClient | null = null;

export function initializeMoodleClient(config: MoodleConfig): MoodleAPIClient {
  moodleClient = new MoodleAPIClient(config);
  return moodleClient;
}

export function getMoodleClient(): MoodleAPIClient {
  if (!moodleClient) {
    throw new Error('Moodle client not initialized. Call initializeMoodleClient first.');
  }
  return moodleClient;
}
