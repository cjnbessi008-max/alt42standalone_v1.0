import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const MOODLE_API_URL = process.env.MOODLE_API_URL || '';
const MOODLE_TOKEN = process.env.MOODLE_TOKEN || '';

interface MoodleResponse {
  [key: string]: any;
}

export class MoodleService {
  private apiUrl: string;
  private token: string;

  constructor() {
    this.apiUrl = MOODLE_API_URL;
    this.token = MOODLE_TOKEN;
  }

  /**
   * Make a request to Moodle Web Service API
   */
  private async makeRequest(
    wsfunction: string,
    params: Record<string, any> = {}
  ): Promise<MoodleResponse> {
    if (!this.apiUrl || !this.token) {
      throw new Error('Moodle API URL or token not configured');
    }

    try {
      const response = await axios.get(this.apiUrl, {
        params: {
          wstoken: this.token,
          wsfunction,
          moodlewsrestformat: 'json',
          ...params,
        },
      });

      if (response.data.exception) {
        throw new Error(response.data.message || 'Moodle API error');
      }

      return response.data;
    } catch (error: any) {
      console.error('Moodle API request failed:', error.message);
      throw error;
    }
  }

  /**
   * Get user information from Moodle
   */
  async getUser(userId: number): Promise<any> {
    const response = await this.makeRequest('core_user_get_users_by_field', {
      field: 'id',
      'values[0]': userId,
    });

    return response[0] || null;
  }

  /**
   * Get users by username
   */
  async getUserByUsername(username: string): Promise<any> {
    const response = await this.makeRequest('core_user_get_users_by_field', {
      field: 'username',
      'values[0]': username,
    });

    return response[0] || null;
  }

  /**
   * Get course information
   */
  async getCourse(courseId: number): Promise<any> {
    const response = await this.makeRequest('core_course_get_courses', {
      'options[ids][0]': courseId,
    });

    return response[0] || null;
  }

  /**
   * Get enrolled users in a course
   */
  async getEnrolledUsers(courseId: number): Promise<any[]> {
    return await this.makeRequest('core_enrol_get_enrolled_users', {
      courseid: courseId,
    });
  }

  /**
   * Submit grade to Moodle gradebook
   */
  async submitGrade(data: {
    courseId: number;
    userId: number;
    itemName: string;
    grade: number;
    maxGrade?: number;
  }): Promise<boolean> {
    try {
      // First, get or create grade item
      const gradeItem = await this.makeRequest('core_grades_create_gradecategories', {
        courseid: data.courseId,
        'definitions[0][name]': data.itemName,
        'definitions[0][grademax]': data.maxGrade || 100,
      });

      // Then update the grade
      await this.makeRequest('core_grades_update_grades', {
        source: 'mod/balancemachine',
        courseid: data.courseId,
        component: 'mod_balancemachine',
        activityid: 0,
        'grades[0][studentid]': data.userId,
        'grades[0][grade]': data.grade,
      });

      return true;
    } catch (error) {
      console.error('Failed to submit grade to Moodle:', error);
      return false;
    }
  }

  /**
   * Sync problem from Moodle quiz
   */
  async syncProblemFromQuiz(quizId: number): Promise<any[]> {
    try {
      // Get quiz questions
      const quiz = await this.makeRequest('mod_quiz_get_quiz_by_courses', {
        'courseids[0]': quizId,
      });

      // Parse questions and convert to Balance Machine format
      // This is a simplified version - actual implementation would need
      // to parse Moodle question format and convert to equation format
      return [];
    } catch (error) {
      console.error('Failed to sync from Moodle quiz:', error);
      return [];
    }
  }

  /**
   * Create activity completion status
   */
  async updateActivityCompletion(data: {
    courseId: number;
    userId: number;
    activityId: number;
    completed: boolean;
  }): Promise<boolean> {
    try {
      await this.makeRequest('core_completion_update_activity_completion_status_manually', {
        cmid: data.activityId,
        completed: data.completed ? 1 : 0,
      });

      return true;
    } catch (error) {
      console.error('Failed to update activity completion:', error);
      return false;
    }
  }

  /**
   * Send message/notification to user
   */
  async sendMessage(data: {
    fromUserId: number;
    toUserId: number;
    subject: string;
    message: string;
  }): Promise<boolean> {
    try {
      await this.makeRequest('core_message_send_instant_messages', {
        'messages[0][touserid]': data.toUserId,
        'messages[0][text]': data.message,
      });

      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  }

  /**
   * Test connection to Moodle
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest('core_webservice_get_site_info');
      console.log('Moodle connection successful:', response.sitename);
      return true;
    } catch (error) {
      console.error('Moodle connection failed');
      return false;
    }
  }
}

export default new MoodleService();
