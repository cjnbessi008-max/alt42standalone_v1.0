import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const MOODLE_API_URL = process.env.MOODLE_API_URL;
const MOODLE_TOKEN = process.env.MOODLE_TOKEN;

// Helper function to call Moodle API
const callMoodleAPI = async (functionName, params = {}) => {
  try {
    const response = await axios.get(MOODLE_API_URL, {
      params: {
        wstoken: MOODLE_TOKEN,
        wsfunction: functionName,
        moodlewsrestformat: 'json',
        ...params
      }
    });

    return response.data;
  } catch (error) {
    console.error('Moodle API error:', error.message);
    throw new Error(`Moodle API call failed: ${error.message}`);
  }
};

// Get user information from Moodle
export const getMoodleUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!MOODLE_API_URL || !MOODLE_TOKEN) {
      return res.status(503).json({
        success: false,
        error: 'Moodle integration not configured'
      });
    }

    const userData = await callMoodleAPI('core_user_get_users_by_field', {
      field: 'id',
      'values[0]': userId
    });

    if (!userData || userData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found in Moodle'
      });
    }

    res.json({
      success: true,
      data: userData[0]
    });
  } catch (error) {
    console.error('Error fetching Moodle user:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get problem/quiz information from Moodle
export const getMoodleProblem = async (req, res) => {
  try {
    const { quizId } = req.params;

    if (!MOODLE_API_URL || !MOODLE_TOKEN) {
      return res.status(503).json({
        success: false,
        error: 'Moodle integration not configured'
      });
    }

    // Get quiz information
    const quizData = await callMoodleAPI('mod_quiz_get_quizzes_by_courses', {
      'courseids[0]': 0 // 0 means all courses
    });

    const quiz = quizData.quizzes?.find(q => q.id === parseInt(quizId));

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Problem/Quiz not found in Moodle'
      });
    }

    res.json({
      success: true,
      data: quiz
    });
  } catch (error) {
    console.error('Error fetching Moodle problem:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Authenticate user with Moodle
export const authenticateMoodle = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    if (!MOODLE_API_URL || !MOODLE_TOKEN) {
      return res.status(503).json({
        success: false,
        error: 'Moodle integration not configured'
      });
    }

    // Note: This is a simplified authentication
    // In production, use Moodle's proper authentication endpoints
    const users = await callMoodleAPI('core_user_get_users_by_field', {
      field: 'username',
      'values[0]': username
    });

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const user = users[0];

    res.json({
      success: true,
      data: {
        userId: user.id,
        username: user.username,
        fullName: user.fullname,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error authenticating with Moodle:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get course information
export const getMoodleCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!MOODLE_API_URL || !MOODLE_TOKEN) {
      return res.status(503).json({
        success: false,
        error: 'Moodle integration not configured'
      });
    }

    const courseData = await callMoodleAPI('core_course_get_courses', {
      'options[ids][0]': courseId
    });

    if (!courseData || courseData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Course not found in Moodle'
      });
    }

    res.json({
      success: true,
      data: courseData[0]
    });
  } catch (error) {
    console.error('Error fetching Moodle course:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Test Moodle connection
export const testMoodleConnection = async (req, res) => {
  try {
    if (!MOODLE_API_URL || !MOODLE_TOKEN) {
      return res.status(503).json({
        success: false,
        error: 'Moodle integration not configured',
        configured: false
      });
    }

    // Test with a simple API call
    const siteInfo = await callMoodleAPI('core_webservice_get_site_info');

    res.json({
      success: true,
      configured: true,
      data: {
        siteName: siteInfo.sitename,
        version: siteInfo.version,
        connected: true
      }
    });
  } catch (error) {
    console.error('Error testing Moodle connection:', error);
    res.status(500).json({
      success: false,
      configured: true,
      error: error.message
    });
  }
};
