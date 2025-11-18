/**
 * Moodle Service
 * Handles integration with Moodle LMS via REST API
 */

import axios from 'axios';
import { logger } from '../config/logger.js';
import dotenv from 'dotenv';

dotenv.config();

const MOODLE_URL = process.env.MOODLE_URL || 'http://localhost:8080';
const MOODLE_TOKEN = process.env.MOODLE_TOKEN || '';
const MOODLE_SERVICE = process.env.MOODLE_SERVICE || 'moodle_mobile_app';

/**
 * Make a Moodle Web Service API call
 */
const callMoodleAPI = async (wsfunction, params = {}) => {
  try {
    const url = `${MOODLE_URL}/webservice/rest/server.php`;

    const response = await axios.get(url, {
      params: {
        wstoken: MOODLE_TOKEN,
        wsfunction,
        moodlewsrestformat: 'json',
        ...params
      },
      timeout: 30000
    });

    if (response.data?.exception) {
      throw new Error(response.data.message || 'Moodle API error');
    }

    return response.data;
  } catch (error) {
    logger.error(`Moodle API call failed (${wsfunction}):`, error.message);
    throw error;
  }
};

/**
 * Fetch quizzes from a Moodle course
 */
export const fetchMoodleQuizzes = async (courseId) => {
  try {
    logger.info(`Fetching quizzes from Moodle course: ${courseId}`);

    const data = await callMoodleAPI('mod_quiz_get_quizzes_by_courses', {
      courseids: [courseId]
    });

    return data.quizzes || [];
  } catch (error) {
    logger.error('Error fetching Moodle quizzes:', error);
    throw error;
  }
};

/**
 * Fetch questions from a Moodle quiz
 */
export const fetchMoodleQuestions = async (quizId) => {
  try {
    logger.info(`Fetching questions from Moodle quiz: ${quizId}`);

    // Get quiz structure
    const structure = await callMoodleAPI('mod_quiz_get_quiz_access_information', {
      quizid: quizId
    });

    // Get quiz questions
    const questions = await callMoodleAPI('mod_quiz_get_user_attempts', {
      quizid: quizId,
      status: 'all'
    });

    // Alternative: Get questions from question bank
    const bankQuestions = await callMoodleAPI('core_question_get_random_question_summaries', {
      categoryid: 0, // Will need proper category
      includesubcategories: 1,
      tagids: [],
      contextid: 0,
      limit: 100,
      offset: 0
    });

    return bankQuestions || [];
  } catch (error) {
    logger.error('Error fetching Moodle questions:', error);
    // Return empty array instead of throwing for graceful degradation
    return [];
  }
};

/**
 * Send grade back to Moodle
 */
export const sendGradeToMoodle = async ({ userId, quizId, questionId, grade, feedback }) => {
  try {
    logger.info(`Sending grade to Moodle: User ${userId}, Quiz ${quizId}, Grade ${grade}`);

    // Save quiz attempt grade
    const result = await callMoodleAPI('mod_quiz_save_attempt', {
      attemptid: 0, // Will need to track attempt IDs
      data: [{
        name: `q${questionId}`,
        value: grade
      }],
      preflightdata: []
    });

    logger.info('Grade sent to Moodle successfully');
    return result;
  } catch (error) {
    logger.error('Error sending grade to Moodle:', error);
    throw error;
  }
};

/**
 * Get user info from Moodle
 */
export const getMoodleUser = async (userId) => {
  try {
    const data = await callMoodleAPI('core_user_get_users_by_field', {
      field: 'id',
      values: [userId]
    });

    return data[0] || null;
  } catch (error) {
    logger.error('Error fetching Moodle user:', error);
    throw error;
  }
};

/**
 * Authenticate user with Moodle
 */
export const authenticateMoodleUser = async (username, password) => {
  try {
    // Note: This requires a custom Moodle plugin for password authentication
    // Standard Moodle Web Services don't expose password authentication directly

    logger.warn('Moodle password authentication not implemented - requires custom plugin');

    // For now, return mock authentication
    // In production, implement custom Moodle authentication plugin
    return {
      success: false,
      message: 'Direct Moodle authentication not available. Use Moodle session or LTI.'
    };
  } catch (error) {
    logger.error('Error authenticating Moodle user:', error);
    throw error;
  }
};

/**
 * Create a new quiz activity in Moodle
 */
export const createMoodleQuiz = async (courseId, quizData) => {
  try {
    logger.info(`Creating quiz in Moodle course: ${courseId}`);

    // Note: Requires appropriate Moodle capabilities
    const result = await callMoodleAPI('core_course_create_contents', {
      courseid: courseId,
      options: [{
        name: quizData.name,
        type: 'quiz'
      }]
    });

    return result;
  } catch (error) {
    logger.error('Error creating Moodle quiz:', error);
    throw error;
  }
};

/**
 * Health check for Moodle connection
 */
export const checkMoodleConnection = async () => {
  try {
    const info = await callMoodleAPI('core_webservice_get_site_info');

    return {
      connected: true,
      sitename: info.sitename,
      moodleVersion: info.release,
      functions: info.functions || []
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message
    };
  }
};

export default {
  fetchMoodleQuizzes,
  fetchMoodleQuestions,
  sendGradeToMoodle,
  getMoodleUser,
  authenticateMoodleUser,
  createMoodleQuiz,
  checkMoodleConnection
};
