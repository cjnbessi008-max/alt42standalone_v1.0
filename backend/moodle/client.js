import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Moodle Web Service Client
 * Communicates with Moodle 3.7 via REST API
 */
class MoodleClient {
  constructor() {
    this.baseURL = process.env.MOODLE_URL || 'http://localhost/moodle';
    this.token = process.env.MOODLE_TOKEN || '';
    this.serviceName = process.env.MOODLE_SERVICE || 'moodle_mobile_app';

    this.client = axios.create({
      baseURL: `${this.baseURL}/webservice/rest/server.php`,
      params: {
        wstoken: this.token,
        moodlewsrestformat: 'json'
      },
      timeout: 10000
    });
  }

  /**
   * Generic Moodle API call
   * @param {string} wsfunction - Moodle web service function name
   * @param {Object} params - Function parameters
   * @returns {Promise<Object>} API response
   */
  async call(wsfunction, params = {}) {
    try {
      const response = await this.client.get('', {
        params: {
          wsfunction,
          ...params
        }
      });

      if (response.data.exception) {
        throw new Error(`Moodle API Error: ${response.data.message}`);
      }

      return response.data;
    } catch (error) {
      console.error(`Moodle API call failed (${wsfunction}):`, error.message);
      throw error;
    }
  }

  /**
   * Get user information from Moodle
   * @param {number} userId - Moodle user ID
   * @returns {Promise<Object>} User data
   */
  async getUser(userId) {
    const data = await this.call('core_user_get_users_by_field', {
      field: 'id',
      'values[0]': userId
    });
    return data[0] || null;
  }

  /**
   * Get course information
   * @param {number} courseId - Moodle course ID
   * @returns {Promise<Object>} Course data
   */
  async getCourse(courseId) {
    const data = await this.call('core_course_get_courses', {
      'options[ids][0]': courseId
    });
    return data[0] || null;
  }

  /**
   * Get quiz/question information
   * @param {number} quizId - Moodle quiz ID
   * @returns {Promise<Object>} Quiz data
   */
  async getQuiz(quizId) {
    return await this.call('mod_quiz_get_quizzes_by_courses', {
      'courseids[0]': quizId
    });
  }

  /**
   * Get question from question bank
   * @param {number} questionId - Question ID
   * @returns {Promise<Object>} Question data
   */
  async getQuestion(questionId) {
    // Note: Moodle 3.7 may require custom web service for question bank access
    // This is a placeholder - implement based on your Moodle configuration
    return await this.call('local_customws_get_question', {
      questionid: questionId
    });
  }

  /**
   * Submit grade back to Moodle
   * @param {number} userId - Moodle user ID
   * @param {number} itemId - Grade item ID
   * @param {number} grade - Grade value (0-100)
   * @returns {Promise<Object>} Grade update result
   */
  async submitGrade(userId, itemId, grade) {
    return await this.call('core_grades_update_grades', {
      source: 'counting_tree_map',
      courseid: itemId,
      component: 'mod_quiz',
      activityid: itemId,
      itemnumber: 0,
      'grades[0][studentid]': userId,
      'grades[0][grade]': grade
    });
  }

  /**
   * Test Moodle connection
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    try {
      const siteInfo = await this.call('core_webservice_get_site_info');
      console.log('✅ Moodle connection successful');
      console.log(`   Site: ${siteInfo.sitename}`);
      console.log(`   Version: ${siteInfo.version}`);
      return true;
    } catch (error) {
      console.error('❌ Moodle connection failed:', error.message);
      return false;
    }
  }

  /**
   * Enroll user in course (if needed)
   * @param {number} userId - User ID
   * @param {number} courseId - Course ID
   * @param {number} roleId - Role ID (default: 5 = student)
   * @returns {Promise<Object>} Enrollment result
   */
  async enrollUser(userId, courseId, roleId = 5) {
    return await this.call('enrol_manual_enrol_users', {
      'enrolments[0][roleid]': roleId,
      'enrolments[0][userid]': userId,
      'enrolments[0][courseid]': courseId
    });
  }
}

// Singleton instance
const moodleClient = new MoodleClient();

export default moodleClient;
