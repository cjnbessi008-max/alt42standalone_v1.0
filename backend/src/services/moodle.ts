import axios, { AxiosInstance } from 'axios';
import logger from '../config/logger';

interface MoodleConfig {
  url: string;
  token: string;
  service?: string;
}

export class MoodleService {
  private client: AxiosInstance;
  private baseUrl: string;
  private token: string;

  constructor(config: MoodleConfig) {
    this.baseUrl = config.url;
    this.token = config.token;

    this.client = axios.create({
      baseURL: `${this.baseUrl}/webservice/rest/server.php`,
      timeout: 10000,
    });
  }

  /**
   * Make a Moodle API call
   */
  private async call(functionName: string, params: Record<string, any> = {}) {
    try {
      const response = await this.client.get('', {
        params: {
          wstoken: this.token,
          wsfunction: functionName,
          moodlewsrestformat: 'json',
          ...params,
        },
      });

      if (response.data.exception) {
        throw new Error(response.data.message || 'Moodle API error');
      }

      return response.data;
    } catch (error) {
      logger.error('Moodle API call failed:', { functionName, error });
      throw error;
    }
  }

  /**
   * Get course information
   */
  async getCourse(courseId: number) {
    return await this.call('core_course_get_courses', {
      'options[ids][0]': courseId,
    });
  }

  /**
   * Get course contents (sections, modules)
   */
  async getCourseContents(courseId: number) {
    return await this.call('core_course_get_contents', {
      courseid: courseId,
    });
  }

  /**
   * Get quiz information
   */
  async getQuiz(quizId: number) {
    return await this.call('mod_quiz_get_quizzes_by_courses', {
      'courseids[0]': quizId,
    });
  }

  /**
   * Get quiz questions
   */
  async getQuizQuestions(quizId: number) {
    return await this.call('mod_quiz_get_user_attempts', {
      quizid: quizId,
    });
  }

  /**
   * Submit grade for a user
   */
  async submitGrade(params: {
    assignmentId: number;
    userId: number;
    grade: number;
    attemptnumber?: number;
  }) {
    return await this.call('mod_assign_save_grade', {
      assignmentid: params.assignmentId,
      userid: params.userId,
      grade: params.grade,
      attemptnumber: params.attemptnumber || -1,
    });
  }

  /**
   * Get enrolled users in a course
   */
  async getEnrolledUsers(courseId: number) {
    return await this.call('core_enrol_get_enrolled_users', {
      courseid: courseId,
    });
  }

  /**
   * Create a custom activity completion
   */
  async updateActivityCompletion(params: {
    courseId: number;
    userId: number;
    cmId: number; // Course module ID
    completed: boolean;
  }) {
    return await this.call('core_completion_update_activity_completion_status_manually', {
      cmid: params.cmId,
      completed: params.completed ? 1 : 0,
    });
  }

  /**
   * Send a message to a user
   */
  async sendMessage(params: {
    toUserId: number;
    subject: string;
    message: string;
  }) {
    return await this.call('core_message_send_instant_messages', {
      'messages[0][touserid]': params.toUserId,
      'messages[0][text]': params.message,
    });
  }

  /**
   * Log custom event
   */
  async logEvent(params: {
    courseId: number;
    userId: number;
    eventName: string;
    eventData: Record<string, any>;
  }) {
    // Custom implementation - may need custom Moodle plugin
    logger.info('Logging event to Moodle:', params);
    // Implement based on your Moodle setup
    return { success: true };
  }
}

// Singleton instance
let moodleService: MoodleService | null = null;

export const getMoodleService = (): MoodleService => {
  if (!moodleService) {
    const url = process.env.MOODLE_URL;
    const token = process.env.MOODLE_TOKEN;

    if (!url || !token) {
      throw new Error('Moodle configuration missing');
    }

    moodleService = new MoodleService({
      url,
      token,
      service: process.env.MOODLE_SERVICE || 'moodle_mobile_app',
    });
  }

  return moodleService;
};

export default MoodleService;
