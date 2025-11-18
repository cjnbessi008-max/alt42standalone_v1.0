import axios, { AxiosInstance } from 'axios';
import { MoodleConfig, MoodleQuestion, MoodleUserResponse } from '../types';

export class MoodleApiService {
  private api: AxiosInstance;
  private config: MoodleConfig;

  constructor(config: MoodleConfig) {
    this.config = config;
    this.api = axios.create({
      baseURL: config.moodleUrl,
      params: {
        wstoken: config.token,
        moodlewsrestformat: 'json',
      },
    });
  }

  /**
   * Test connection to Moodle
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.api.get('/webservice/rest/server.php', {
        params: {
          wsfunction: 'core_webservice_get_site_info',
        },
      });
      return response.status === 200 && !response.data.exception;
    } catch (error) {
      console.error('Moodle connection test failed:', error);
      return false;
    }
  }

  /**
   * Fetch a question from Moodle quiz
   */
  async fetchQuestion(questionId: number): Promise<MoodleQuestion | null> {
    try {
      const response = await this.api.get('/webservice/rest/server.php', {
        params: {
          wsfunction: 'mod_quiz_get_quiz_data',
          quizid: this.config.quizId,
          questionid: questionId,
        },
      });

      if (response.data.exception) {
        throw new Error(response.data.message);
      }

      // Transform Moodle response to our format
      return this.transformMoodleQuestion(response.data);
    } catch (error) {
      console.error('Failed to fetch question:', error);
      return null;
    }
  }

  /**
   * Submit user response to Moodle
   */
  async submitResponse(response: MoodleUserResponse): Promise<boolean> {
    try {
      const result = await this.api.post('/webservice/rest/server.php', {
        wsfunction: 'mod_quiz_process_attempt',
        attemptid: response.questionId,
        data: JSON.stringify({
          userId: response.userId,
          answer: response.answer,
          timestamp: response.timestamp,
        }),
      });

      return !result.data.exception;
    } catch (error) {
      console.error('Failed to submit response:', error);
      return false;
    }
  }

  /**
   * Get quiz questions
   */
  async getQuizQuestions(): Promise<MoodleQuestion[]> {
    try {
      const response = await this.api.get('/webservice/rest/server.php', {
        params: {
          wsfunction: 'mod_quiz_get_quiz_access_information',
          quizid: this.config.quizId,
        },
      });

      if (response.data.exception) {
        throw new Error(response.data.message);
      }

      return response.data.questions?.map(this.transformMoodleQuestion) || [];
    } catch (error) {
      console.error('Failed to fetch quiz questions:', error);
      return [];
    }
  }

  /**
   * Transform Moodle question format to our internal format
   */
  private transformMoodleQuestion(moodleData: any): MoodleQuestion {
    return {
      id: moodleData.id || 0,
      questionText: moodleData.questiontext || '',
      questionType: moodleData.qtype || 'multichoice',
      options: moodleData.options || [],
      correctAnswer: moodleData.correctanswer,
      metadata: {
        ...moodleData,
      },
    };
  }
}

/**
 * Create Moodle API instance
 */
export function createMoodleApi(config: MoodleConfig): MoodleApiService {
  return new MoodleApiService(config);
}
