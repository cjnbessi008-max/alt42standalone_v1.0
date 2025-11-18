import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const MOODLE_URL = process.env.MOODLE_URL || '';
const MOODLE_TOKEN = process.env.MOODLE_TOKEN || '';
const MOODLE_SERVICE = process.env.MOODLE_SERVICE || 'moodle_mobile_app';

interface MoodleUser {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
}

interface MoodleProblem {
  id: number;
  name: string;
  intro: string;
  timeopen?: number;
  timeclose?: number;
}

/**
 * Moodle Web Services API Integration
 * Docs: https://docs.moodle.org/dev/Web_services
 */
export class MoodleService {
  private baseUrl: string;
  private token: string;

  constructor() {
    this.baseUrl = MOODLE_URL;
    this.token = MOODLE_TOKEN;
  }

  /**
   * Check if Moodle integration is configured
   */
  isConfigured(): boolean {
    return this.baseUrl !== '' && this.token !== '';
  }

  /**
   * Make a request to Moodle Web Services API
   */
  private async request(wsfunction: string, params: Record<string, any> = {}) {
    if (!this.isConfigured()) {
      throw new Error('Moodle integration not configured');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/webservice/rest/server.php`, {
        params: {
          wstoken: this.token,
          wsfunction,
          moodlewsrestformat: 'json',
          ...params,
        },
      });

      if (response.data.exception) {
        throw new Error(`Moodle API Error: ${response.data.message}`);
      }

      return response.data;
    } catch (error) {
      console.error('Moodle API request failed:', error);
      throw error;
    }
  }

  /**
   * Get user information by ID
   */
  async getUser(userId: number): Promise<MoodleUser | null> {
    try {
      const response = await this.request('core_user_get_users_by_field', {
        field: 'id',
        'values[0]': userId,
      });

      if (response && response.length > 0) {
        return response[0];
      }

      return null;
    } catch (error) {
      console.error('Failed to get Moodle user:', error);
      return null;
    }
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<MoodleUser | null> {
    try {
      const response = await this.request('core_user_get_users_by_field', {
        field: 'username',
        'values[0]': username,
      });

      if (response && response.length > 0) {
        return response[0];
      }

      return null;
    } catch (error) {
      console.error('Failed to get Moodle user by username:', error);
      return null;
    }
  }

  /**
   * Get course information
   */
  async getCourse(courseId: number) {
    try {
      const response = await this.request('core_course_get_courses', {
        'options[ids][0]': courseId,
      });

      if (response && response.length > 0) {
        return response[0];
      }

      return null;
    } catch (error) {
      console.error('Failed to get Moodle course:', error);
      return null;
    }
  }

  /**
   * Get course contents (modules, activities)
   */
  async getCourseContents(courseId: number) {
    try {
      return await this.request('core_course_get_contents', {
        courseid: courseId,
      });
    } catch (error) {
      console.error('Failed to get Moodle course contents:', error);
      return null;
    }
  }

  /**
   * Submit grade to Moodle gradebook
   * This would typically be used to report student progress back to Moodle
   */
  async submitGrade(courseId: number, userId: number, itemName: string, grade: number) {
    try {
      // This is a placeholder - actual implementation depends on Moodle gradebook setup
      // You may need to use mod_assign_save_grade or similar functions
      console.log('Submitting grade to Moodle:', {
        courseId,
        userId,
        itemName,
        grade,
      });

      // Example: Update custom grade item
      // await this.request('core_grades_update_grades', {...});

      return { success: true };
    } catch (error) {
      console.error('Failed to submit grade to Moodle:', error);
      throw error;
    }
  }

  /**
   * Sync student from Moodle
   * Creates or updates student in our database based on Moodle user
   */
  async syncStudent(moodleUserId: number) {
    const moodleUser = await this.getUser(moodleUserId);

    if (!moodleUser) {
      throw new Error(`Moodle user ${moodleUserId} not found`);
    }

    return {
      name: `${moodleUser.firstname} ${moodleUser.lastname}`,
      email: moodleUser.email,
      moodle_user_id: moodleUser.id.toString(),
    };
  }

  /**
   * Parse problem data from Moodle activity
   * This is a helper to extract Visual Quadratic problem data from Moodle
   */
  parseProblemFromMoodle(activityData: any): Partial<MoodleProblem> {
    // This would parse Moodle activity JSON to extract:
    // - Problem title
    // - Problem description
    // - Target coefficients (a, b, c)
    // - Difficulty level
    // - Time constraints

    return {
      id: activityData.id,
      name: activityData.name,
      intro: activityData.intro,
    };
  }
}

export const moodleService = new MoodleService();
