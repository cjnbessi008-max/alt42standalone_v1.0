/**
 * Moodle API Service
 * Integrates with Moodle 3.7 LMS (PHP 7.1.9, MySQL 5.7)
 */

import axios, { AxiosInstance } from 'axios';
import type { MoodleConfig, MoodleResponse, MoodleQuestion } from '@types/index';

export class MoodleApiService {
  private axiosInstance: AxiosInstance;
  private config: MoodleConfig;

  constructor(config: MoodleConfig) {
    this.config = {
      ...config,
      moodlewsrestformat: config.moodlewsrestformat || 'json'
    };

    this.axiosInstance = axios.create({
      baseURL: `${config.domainname}/webservice/rest/server.php`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  /**
   * Generic Moodle Web Service call
   */
  private async callWebService<T>(
    wsfunction: string,
    params: Record<string, any> = {}
  ): Promise<MoodleResponse<T>> {
    try {
      const formData = new URLSearchParams({
        wstoken: this.config.wstoken,
        wsfunction,
        moodlewsrestformat: this.config.moodlewsrestformat || 'json',
        ...params,
      });

      const response = await this.axiosInstance.post('', formData);

      // Check for Moodle error response
      if (response.data.exception) {
        return {
          error: {
            exception: response.data.exception,
            errorcode: response.data.errorcode,
            message: response.data.message,
          },
        };
      }

      return {
        data: response.data,
        warnings: response.data.warnings,
      };
    } catch (error: any) {
      return {
        error: {
          exception: 'network_error',
          errorcode: 'connection_failed',
          message: error.message || 'Failed to connect to Moodle',
        },
      };
    }
  }

  /**
   * Get question by ID
   */
  async getQuestion(questionId: number): Promise<MoodleResponse<MoodleQuestion>> {
    return this.callWebService<MoodleQuestion>('core_question_get_questions', {
      questionids: [questionId],
    });
  }

  /**
   * Get questions by category
   */
  async getQuestionsByCategory(categoryId: number): Promise<MoodleResponse<MoodleQuestion[]>> {
    return this.callWebService<MoodleQuestion[]>('core_question_get_questions_by_category', {
      categoryid: categoryId,
    });
  }

  /**
   * Get quiz questions
   */
  async getQuizQuestions(quizId: number): Promise<MoodleResponse<MoodleQuestion[]>> {
    return this.callWebService<MoodleQuestion[]>('mod_quiz_get_quiz_questions', {
      quizid: quizId,
    });
  }

  /**
   * Submit quiz attempt
   */
  async submitQuizAttempt(
    attemptId: number,
    answers: Record<number, any>
  ): Promise<MoodleResponse<any>> {
    const processedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
      name: `q${questionId}:answer`,
      value: answer,
    }));

    return this.callWebService('mod_quiz_save_attempt', {
      attemptid: attemptId,
      data: processedAnswers,
    });
  }

  /**
   * Get student progress
   */
  async getStudentProgress(
    userId: number,
    quizId: number
  ): Promise<MoodleResponse<any>> {
    return this.callWebService('mod_quiz_get_user_attempts', {
      quizid: quizId,
      userid: userId,
    });
  }

  /**
   * Test connection to Moodle
   */
  async testConnection(): Promise<boolean> {
    const result = await this.callWebService('core_webservice_get_site_info');
    return !result.error;
  }
}

/**
 * Factory function to create MoodleApiService instance
 */
export function createMoodleApi(config: MoodleConfig): MoodleApiService {
  return new MoodleApiService(config);
}
