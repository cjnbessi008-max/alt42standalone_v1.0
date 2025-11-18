/**
 * Moodle Integration Routes
 * Endpoints for syncing data with Moodle LMS
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');

const MOODLE_URL = config.moodle.url;
const MOODLE_TOKEN = config.moodle.apiToken;

/**
 * Helper function to call Moodle Web Services API
 */
async function callMoodleAPI(wsfunction, params = {}) {
  const url = `${MOODLE_URL}/webservice/rest/server.php`;

  const requestParams = {
    wstoken: MOODLE_TOKEN,
    wsfunction,
    moodlewsrestformat: 'json',
    ...params
  };

  try {
    const response = await axios.get(url, { params: requestParams });
    return response.data;
  } catch (error) {
    logger.error(`Moodle API call failed: ${error.message}`);
    throw error;
  }
}

/**
 * POST /api/moodle/sync/students
 * Sync students from Moodle
 */
router.post('/sync/students', async (req, res, next) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: 'courseId is required' });
    }

    // Call Moodle API to get enrolled users
    const enrolledUsers = await callMoodleAPI('core_enrol_get_enrolled_users', {
      courseid: courseId
    });

    // TODO: Store students in database
    logger.info(`Synced ${enrolledUsers.length} students from Moodle course ${courseId}`);

    res.json({
      synced: enrolledUsers.length,
      students: enrolledUsers.map(user => ({
        moodle_user_id: user.id,
        username: user.username,
        full_name: user.fullname,
        email: user.email
      })),
      message: 'Students synced successfully (database integration pending)'
    });

  } catch (error) {
    logger.error(`Student sync failed: ${error.message}`);

    // If Moodle is not configured, return friendly error
    if (!MOODLE_TOKEN || MOODLE_TOKEN === 'your-moodle-api-token') {
      return res.status(503).json({
        error: 'Moodle integration not configured',
        message: 'Please set MOODLE_URL and MOODLE_API_TOKEN in .env file'
      });
    }

    next(error);
  }
});

/**
 * POST /api/moodle/sync/courses
 * Sync courses from Moodle
 */
router.post('/sync/courses', async (req, res, next) => {
  try {
    // Get all courses
    const courses = await callMoodleAPI('core_course_get_courses');

    // TODO: Store courses in database
    logger.info(`Synced ${courses.length} courses from Moodle`);

    res.json({
      synced: courses.length,
      courses: courses.map(course => ({
        moodle_course_id: course.id,
        course_name: course.fullname,
        course_code: course.shortname,
        description: course.summary
      })),
      message: 'Courses synced successfully (database integration pending)'
    });

  } catch (error) {
    logger.error(`Course sync failed: ${error.message}`);

    if (!MOODLE_TOKEN || MOODLE_TOKEN === 'your-moodle-api-token') {
      return res.status(503).json({
        error: 'Moodle integration not configured',
        message: 'Please set MOODLE_URL and MOODLE_API_TOKEN in .env file'
      });
    }

    next(error);
  }
});

/**
 * GET /api/moodle/courses/:courseId
 * Get course details from Moodle
 */
router.get('/courses/:courseId', async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const courses = await callMoodleAPI('core_course_get_courses', {
      options: { ids: [courseId] }
    });

    if (!courses || courses.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(courses[0]);

  } catch (error) {
    logger.error(`Failed to fetch course: ${error.message}`);
    next(error);
  }
});

/**
 * GET /api/moodle/users/:userId
 * Get user details from Moodle
 */
router.get('/users/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    const users = await callMoodleAPI('core_user_get_users_by_field', {
      field: 'id',
      values: [userId]
    });

    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);

  } catch (error) {
    logger.error(`Failed to fetch user: ${error.message}`);
    next(error);
  }
});

/**
 * GET /api/moodle/status
 * Check Moodle connection status
 */
router.get('/status', async (req, res, next) => {
  try {
    if (!MOODLE_TOKEN || MOODLE_TOKEN === 'your-moodle-api-token') {
      return res.json({
        connected: false,
        message: 'Moodle integration not configured'
      });
    }

    // Try to get site info to verify connection
    const siteInfo = await callMoodleAPI('core_webservice_get_site_info');

    res.json({
      connected: true,
      moodle_url: MOODLE_URL,
      site_name: siteInfo.sitename,
      version: siteInfo.version,
      message: 'Connected to Moodle successfully'
    });

  } catch (error) {
    logger.error(`Moodle status check failed: ${error.message}`);

    res.json({
      connected: false,
      error: error.message,
      message: 'Failed to connect to Moodle'
    });
  }
});

module.exports = router;
