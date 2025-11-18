/**
 * Moodle LMS Integration Module
 *
 * This module provides integration with Moodle LMS using LTI (Learning Tools Interoperability)
 * protocol and Moodle Web Services API.
 *
 * Features:
 * - LTI 1.3 authentication
 * - Module synchronization
 * - Grade passback
 * - Assignment creation
 *
 * Requirements:
 * - Moodle 3.7+ (PHP 7.1.9, MySQL 5.7)
 * - LTI Consumer key configured in Moodle
 * - Web Services enabled in Moodle
 */

import crypto from 'crypto';
import axios from 'axios';
import { query } from '../config/database.js';

class MoodleConnector {
  constructor(config) {
    this.instanceUrl = config.instanceUrl;
    this.consumerKey = config.consumerKey;
    this.consumerSecret = config.consumerSecret;
    this.wsToken = config.wsToken; // Moodle Web Services token
  }

  /**
   * Verify LTI launch request from Moodle
   * @param {Object} params - LTI parameters from Moodle
   * @returns {boolean} - True if signature is valid
   */
  verifyLTISignature(params) {
    const { oauth_signature, ...baseParams } = params;

    // Sort parameters
    const sortedParams = Object.keys(baseParams)
      .sort()
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(baseParams[key])}`)
      .join('&');

    // Create signature base string
    const method = 'POST';
    const url = `${this.instanceUrl}/mod/lti/launch.php`;
    const baseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;

    // Generate signature
    const key = `${encodeURIComponent(this.consumerSecret)}&`;
    const hmac = crypto.createHmac('sha1', key);
    hmac.update(baseString);
    const signature = hmac.digest('base64');

    return signature === oauth_signature;
  }

  /**
   * Fetch course information from Moodle
   * @param {number} courseId - Moodle course ID
   * @returns {Object} - Course information
   */
  async getCourse(courseId) {
    try {
      const response = await axios.get(`${this.instanceUrl}/webservice/rest/server.php`, {
        params: {
          wstoken: this.wsToken,
          wsfunction: 'core_course_get_courses',
          moodlewsrestformat: 'json',
          options: { ids: [courseId] }
        }
      });

      return response.data[0];
    } catch (error) {
      console.error('Failed to fetch Moodle course:', error);
      throw error;
    }
  }

  /**
   * Create an assignment in Moodle course
   * @param {number} courseId - Moodle course ID
   * @param {Object} assignmentData - Assignment details
   * @returns {Object} - Created assignment
   */
  async createAssignment(courseId, assignmentData) {
    try {
      const response = await axios.post(
        `${this.instanceUrl}/webservice/rest/server.php`,
        null,
        {
          params: {
            wstoken: this.wsToken,
            wsfunction: 'mod_assign_create_assignment',
            moodlewsrestformat: 'json',
            courseid: courseId,
            name: assignmentData.name,
            intro: assignmentData.description,
            introformat: 1, // HTML format
            duedate: assignmentData.dueDate || 0,
            allowsubmissionsfromdate: assignmentData.startDate || 0
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to create Moodle assignment:', error);
      throw error;
    }
  }

  /**
   * Sync module with Moodle
   * @param {string} moduleId - Local module ID
   * @param {number} courseId - Moodle course ID
   * @returns {Object} - Sync result
   */
  async syncModule(moduleId, courseId) {
    try {
      // Get local module data
      const moduleResult = await query(
        'SELECT * FROM modules WHERE id = $1',
        [moduleId]
      );

      if (moduleResult.rows.length === 0) {
        throw new Error('Module not found');
      }

      const module = moduleResult.rows[0];

      // Create or update assignment in Moodle
      const assignment = await this.createAssignment(courseId, {
        name: module.name,
        description: module.description
      });

      // Store integration mapping
      await query(
        `INSERT INTO moodle_integration (module_id, moodle_instance_url, moodle_course_id, moodle_activity_id, sync_status, last_sync_at)
         VALUES ($1, $2, $3, $4, 'synced', NOW())
         ON CONFLICT (module_id) DO UPDATE
         SET moodle_course_id = $3,
             moodle_activity_id = $4,
             sync_status = 'synced',
             last_sync_at = NOW()`,
        [moduleId, this.instanceUrl, courseId, assignment.id]
      );

      return {
        success: true,
        moduleId,
        moodleAssignmentId: assignment.id,
        syncedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to sync module with Moodle:', error);

      // Update sync status to failed
      await query(
        `UPDATE moodle_integration
         SET sync_status = 'failed',
             last_sync_at = NOW()
         WHERE module_id = $1`,
        [moduleId]
      );

      throw error;
    }
  }

  /**
   * Send grade back to Moodle
   * @param {string} studentId - Student ID
   * @param {string} moduleId - Module ID
   * @param {number} score - Score (0-100)
   * @returns {Object} - Grade submission result
   */
  async sendGrade(studentId, moduleId, score) {
    try {
      // Get Moodle integration info
      const integrationResult = await query(
        'SELECT * FROM moodle_integration WHERE module_id = $1',
        [moduleId]
      );

      if (integrationResult.rows.length === 0) {
        throw new Error('Module not synced with Moodle');
      }

      const integration = integrationResult.rows[0];

      // Send grade via Moodle Web Service
      const response = await axios.post(
        `${this.instanceUrl}/webservice/rest/server.php`,
        null,
        {
          params: {
            wstoken: this.wsToken,
            wsfunction: 'mod_assign_save_grade',
            moodlewsrestformat: 'json',
            assignmentid: integration.moodle_activity_id,
            userid: studentId,
            grade: score,
            attemptnumber: -1
          }
        }
      );

      return {
        success: true,
        studentId,
        moduleId,
        score,
        submittedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to send grade to Moodle:', error);
      throw error;
    }
  }

  /**
   * Fetch enrolled students from Moodle course
   * @param {number} courseId - Moodle course ID
   * @returns {Array} - List of enrolled students
   */
  async getEnrolledStudents(courseId) {
    try {
      const response = await axios.get(`${this.instanceUrl}/webservice/rest/server.php`, {
        params: {
          wstoken: this.wsToken,
          wsfunction: 'core_enrol_get_enrolled_users',
          moodlewsrestformat: 'json',
          courseid: courseId
        }
      });

      return response.data.map(user => ({
        id: user.id,
        username: user.username,
        fullname: user.fullname,
        email: user.email
      }));
    } catch (error) {
      console.error('Failed to fetch enrolled students:', error);
      throw error;
    }
  }
}

/**
 * Factory function to create Moodle connector instance
 * @param {Object} config - Moodle configuration
 * @returns {MoodleConnector}
 */
export const createMoodleConnector = (config) => {
  return new MoodleConnector(config);
};

/**
 * Get Moodle connector for a specific instance
 * @param {string} instanceUrl - Moodle instance URL
 * @returns {MoodleConnector}
 */
export const getMoodleConnector = async (instanceUrl) => {
  // In production, fetch credentials from secure storage
  const config = {
    instanceUrl,
    consumerKey: process.env.MOODLE_CONSUMER_KEY,
    consumerSecret: process.env.MOODLE_CONSUMER_SECRET,
    wsToken: process.env.MOODLE_WS_TOKEN
  };

  return createMoodleConnector(config);
};

export default MoodleConnector;
