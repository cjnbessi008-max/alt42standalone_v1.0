import axios, { AxiosResponse } from 'axios';
import { MOODLE_WS_ENDPOINT, moodleConfig } from '../config/moodle';
import { MoodleWSResponse, MoodleQuestion, MoodleQuiz } from '../types';

export class MoodleService {
  /**
   * Call Moodle web service function
   */
  private async callMoodleWS(
    wsfunction: string,
    params: Record<string, any> = {}
  ): Promise<MoodleWSResponse> {
    try {
      const response: AxiosResponse<MoodleWSResponse> = await axios.get(
        MOODLE_WS_ENDPOINT,
        {
          params: {
            wstoken: moodleConfig.token,
            wsfunction,
            moodlewsrestformat: 'json',
            ...params,
          },
          timeout: moodleConfig.timeout,
        }
      );

      // Check for Moodle errors
      if (response.data.exception || response.data.errorcode) {
        throw new Error(
          response.data.message || 'Moodle web service error'
        );
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Moodle API error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get quiz by ID
   */
  async getQuiz(quizId: number): Promise<MoodleQuiz | null> {
    try {
      const data = await this.callMoodleWS('mod_quiz_get_quizzes_by_courses', {
        courseids: [],
      });

      const quizzes = data.quizzes || [];
      const quiz = quizzes.find((q: MoodleQuiz) => q.id === quizId);

      return quiz || null;
    } catch (error) {
      console.error('Error fetching quiz:', error);
      throw error;
    }
  }

  /**
   * Get question data from quiz attempt
   */
  async getQuizQuestions(quizId: number): Promise<MoodleQuestion[]> {
    try {
      // Note: This is a simplified version. In production, you'd need to:
      // 1. Start a quiz attempt
      // 2. Get attempt data
      // 3. Extract questions
      // For now, we'll query directly from database via another service

      console.warn(
        'getQuizQuestions: Using simplified implementation. Consider using database query for production.'
      );

      return [];
    } catch (error) {
      console.error('Error fetching quiz questions:', error);
      throw error;
    }
  }

  /**
   * Get question by ID (requires direct database access)
   * This is a placeholder - actual implementation in DatabaseService
   */
  async getQuestion(questionId: number): Promise<MoodleQuestion | null> {
    console.warn(
      'getQuestion: This method requires database access. Use DatabaseService instead.'
    );
    return null;
  }

  /**
   * Validate Moodle connection
   */
  async validateConnection(): Promise<boolean> {
    try {
      await this.callMoodleWS('core_webservice_get_site_info');
      console.log('✅ Moodle connection successful');
      return true;
    } catch (error) {
      console.error('❌ Moodle connection failed:', error);
      return false;
    }
  }
}

export default new MoodleService();
