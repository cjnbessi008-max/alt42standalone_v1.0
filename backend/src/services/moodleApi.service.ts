import axios, { AxiosInstance } from 'axios';
import {
  MoodleQuiz,
  MoodleAttempt,
  MoodleQuestion,
  MoodleQuestionAttempt,
  MoodleUser
} from '../types/moodle.types';

export class MoodleApiService {
  private api: AxiosInstance;
  private token: string;
  private baseUrl: string;

  constructor(moodleUrl: string, token: string) {
    this.baseUrl = moodleUrl;
    this.token = token;

    this.api = axios.create({
      baseURL: `${moodleUrl}/webservice/rest/server.php`,
      params: {
        wstoken: token,
        moodlewsrestformat: 'json'
      }
    });
  }

  /**
   * Get all quizzes from a course
   */
  async getQuizzesByCourse(courseId: number): Promise<MoodleQuiz[]> {
    try {
      const response = await this.api.get('', {
        params: {
          wsfunction: 'mod_quiz_get_quizzes_by_courses',
          courseids: [courseId]
        }
      });

      return response.data.quizzes || [];
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      throw new Error('Failed to fetch quizzes from Moodle');
    }
  }

  /**
   * Get all quizzes (from all courses the user has access to)
   */
  async getAllQuizzes(): Promise<MoodleQuiz[]> {
    try {
      const response = await this.api.get('', {
        params: {
          wsfunction: 'mod_quiz_get_quizzes_by_courses'
        }
      });

      return response.data.quizzes || [];
    } catch (error) {
      console.error('Error fetching all quizzes:', error);
      throw new Error('Failed to fetch quizzes from Moodle');
    }
  }

  /**
   * Get quiz details by ID
   */
  async getQuizById(quizId: number): Promise<MoodleQuiz | null> {
    try {
      const response = await this.api.get('', {
        params: {
          wsfunction: 'mod_quiz_get_quiz_by_id',
          quizid: quizId
        }
      });

      return response.data || null;
    } catch (error) {
      console.error(`Error fetching quiz ${quizId}:`, error);
      throw new Error(`Failed to fetch quiz ${quizId}`);
    }
  }

  /**
   * Get all attempts for a quiz
   */
  async getQuizAttempts(quizId: number): Promise<MoodleAttempt[]> {
    try {
      const response = await this.api.get('', {
        params: {
          wsfunction: 'mod_quiz_get_user_attempts',
          quizid: quizId,
          status: 'all'
        }
      });

      return response.data.attempts || [];
    } catch (error) {
      console.error(`Error fetching attempts for quiz ${quizId}:`, error);
      throw new Error(`Failed to fetch quiz attempts`);
    }
  }

  /**
   * Get attempt details including question attempts
   */
  async getAttemptData(attemptId: number): Promise<{
    attempt: MoodleAttempt;
    questions: MoodleQuestionAttempt[];
  }> {
    try {
      const response = await this.api.get('', {
        params: {
          wsfunction: 'mod_quiz_get_attempt_data',
          attemptid: attemptId,
          page: -1 // Get all pages
        }
      });

      return {
        attempt: response.data.attempt,
        questions: response.data.questions || []
      };
    } catch (error) {
      console.error(`Error fetching attempt ${attemptId} data:`, error);
      throw new Error(`Failed to fetch attempt data`);
    }
  }

  /**
   * Get user information
   */
  async getUserById(userId: number): Promise<MoodleUser | null> {
    try {
      const response = await this.api.get('', {
        params: {
          wsfunction: 'core_user_get_users_by_field',
          field: 'id',
          values: [userId]
        }
      });

      return response.data[0] || null;
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Get all students enrolled in a course
   */
  async getCourseStudents(courseId: number): Promise<MoodleUser[]> {
    try {
      const response = await this.api.get('', {
        params: {
          wsfunction: 'core_enrol_get_enrolled_users',
          courseid: courseId
        }
      });

      return response.data || [];
    } catch (error) {
      console.error(`Error fetching students for course ${courseId}:`, error);
      throw new Error(`Failed to fetch course students`);
    }
  }
}
