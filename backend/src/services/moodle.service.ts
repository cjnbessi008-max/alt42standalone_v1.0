import axios, { AxiosInstance } from 'axios';
import { MoodleQuiz, MoodleQuestion } from '../types';
import dotenv from 'dotenv';

dotenv.config();

class MoodleService {
  private client: AxiosInstance;
  private moodleUrl: string;
  private token: string;

  constructor() {
    this.moodleUrl = process.env.MOODLE_URL || '';
    this.token = process.env.MOODLE_TOKEN || '';

    if (!this.moodleUrl || !this.token) {
      console.warn('⚠️ Moodle configuration missing. Please set MOODLE_URL and MOODLE_TOKEN in .env');
    }

    this.client = axios.create({
      baseURL: `${this.moodleUrl}/webservice/rest/server.php`,
      params: {
        wstoken: this.token,
        moodlewsrestformat: 'json'
      },
      timeout: 10000
    });
  }

  /**
   * Get quiz by course ID
   */
  async getQuizzesByCourse(courseId: number): Promise<MoodleQuiz[]> {
    try {
      const response = await this.client.get('', {
        params: {
          wsfunction: 'mod_quiz_get_quizzes_by_courses',
          courseids: [courseId]
        }
      });

      return response.data.quizzes || [];
    } catch (error) {
      console.error('Error fetching quizzes from Moodle:', error);
      throw new Error('Failed to fetch quizzes from Moodle');
    }
  }

  /**
   * Get quiz by quiz ID
   */
  async getQuizById(quizId: number): Promise<MoodleQuiz | null> {
    try {
      const response = await this.client.get('', {
        params: {
          wsfunction: 'mod_quiz_get_quiz_by_courses',
          courseids: [0] // 0 means all courses
        }
      });

      const quizzes = response.data.quizzes || [];
      return quizzes.find((q: MoodleQuiz) => q.id === quizId) || null;
    } catch (error) {
      console.error('Error fetching quiz from Moodle:', error);
      throw new Error('Failed to fetch quiz from Moodle');
    }
  }

  /**
   * Get user attempts for a quiz
   */
  async getUserAttempts(quizId: number, userId: number): Promise<any[]> {
    try {
      const response = await this.client.get('', {
        params: {
          wsfunction: 'mod_quiz_get_user_attempts',
          quizid: quizId,
          userid: userId
        }
      });

      return response.data.attempts || [];
    } catch (error) {
      console.error('Error fetching user attempts from Moodle:', error);
      throw new Error('Failed to fetch user attempts from Moodle');
    }
  }

  /**
   * Get course contents
   */
  async getCourseContents(courseId: number): Promise<any> {
    try {
      const response = await this.client.get('', {
        params: {
          wsfunction: 'core_course_get_contents',
          courseid: courseId
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching course contents from Moodle:', error);
      throw new Error('Failed to fetch course contents from Moodle');
    }
  }

  /**
   * Get user information
   */
  async getUserInfo(userId: number): Promise<any> {
    try {
      const response = await this.client.get('', {
        params: {
          wsfunction: 'core_user_get_users_by_field',
          field: 'id',
          values: [userId]
        }
      });

      return response.data[0] || null;
    } catch (error) {
      console.error('Error fetching user info from Moodle:', error);
      throw new Error('Failed to fetch user info from Moodle');
    }
  }

  /**
   * Submit quiz results back to Moodle
   */
  async submitQuizResult(attemptId: number, questionId: number, answer: any): Promise<boolean> {
    try {
      const response = await this.client.post('', null, {
        params: {
          wsfunction: 'mod_quiz_process_attempt',
          attemptid: attemptId,
          data: JSON.stringify([{
            name: `q${questionId}`,
            value: JSON.stringify(answer)
          }])
        }
      });

      return response.data.state === 'complete';
    } catch (error) {
      console.error('Error submitting quiz result to Moodle:', error);
      return false;
    }
  }

  /**
   * Parse Dynamic Tree configuration from quiz description
   */
  parseTreeConfigFromQuiz(quiz: MoodleQuiz): any | null {
    try {
      // Look for JSON configuration in quiz intro text
      const jsonMatch = quiz.intro.match(/\{[\s\S]*"type"[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return null;
    } catch (error) {
      console.error('Error parsing tree config from quiz:', error);
      return null;
    }
  }

  /**
   * Test Moodle connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('', {
        params: {
          wsfunction: 'core_webservice_get_site_info'
        }
      });

      console.log('✅ Moodle connection successful:', response.data.sitename);
      return true;
    } catch (error: any) {
      console.error('❌ Moodle connection failed:', error.message);
      return false;
    }
  }
}

export default new MoodleService();
