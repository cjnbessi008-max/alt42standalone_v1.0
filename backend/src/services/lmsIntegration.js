const axios = require('axios');
require('dotenv').config();

/**
 * LMS Integration Service
 * Handles communication with KAIST LMS system
 */

const LMS_API_URL = process.env.LMS_API_URL;
const LMS_API_KEY = process.env.LMS_API_KEY;

/**
 * Authenticate student with LMS SSO
 */
const authenticateWithLMS = async (ssoToken) => {
  try {
    if (!process.env.LMS_SSO_ENABLED || process.env.LMS_SSO_ENABLED !== 'true') {
      // SSO disabled - return mock user for development
      return {
        user_id: 'dev-user-123',
        email: 'student@kaist.ac.kr',
        name: 'Test Student',
        role: 'student',
      };
    }

    const response = await axios.post(
      `${LMS_API_URL}/auth/verify`,
      { token: ssoToken },
      {
        headers: {
          'Authorization': `Bearer ${LMS_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );

    return response.data.user;
  } catch (error) {
    console.error('LMS authentication error:', error.message);
    throw new Error('Failed to authenticate with LMS');
  }
};

/**
 * Sync student progress to LMS
 */
const syncProgressToLMS = async (studentId, moduleId, progressData) => {
  try {
    if (!process.env.LMS_SSO_ENABLED || process.env.LMS_SSO_ENABLED !== 'true') {
      console.log('LMS sync disabled - skipping progress sync');
      return { success: true, message: 'LMS sync disabled' };
    }

    const response = await axios.post(
      `${LMS_API_URL}/progress/sync`,
      {
        student_id: studentId,
        module_id: moduleId,
        progress: progressData,
      },
      {
        headers: {
          'Authorization': `Bearer ${LMS_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );

    return response.data;
  } catch (error) {
    console.error('LMS progress sync error:', error.message);
    // Don't throw - progress sync failure shouldn't break the app
    return { success: false, error: error.message };
  }
};

/**
 * Get student enrollment status
 */
const checkEnrollment = async (studentId, moduleId) => {
  try {
    if (!process.env.LMS_SSO_ENABLED || process.env.LMS_SSO_ENABLED !== 'true') {
      // Development mode - always enrolled
      return { enrolled: true, module_name: 'Test Module' };
    }

    const response = await axios.get(
      `${LMS_API_URL}/enrollment/check`,
      {
        params: {
          student_id: studentId,
          module_id: moduleId,
        },
        headers: {
          'Authorization': `Bearer ${LMS_API_KEY}`,
        },
        timeout: 5000,
      }
    );

    return response.data;
  } catch (error) {
    console.error('LMS enrollment check error:', error.message);
    throw new Error('Failed to verify enrollment');
  }
};

/**
 * Export grades to LMS gradebook
 */
const exportGradesToLMS = async (studentId, moduleId, gradeData) => {
  try {
    if (!process.env.LMS_SSO_ENABLED || process.env.LMS_SSO_ENABLED !== 'true') {
      console.log('LMS sync disabled - skipping grade export');
      return { success: true, message: 'LMS sync disabled' };
    }

    const response = await axios.post(
      `${LMS_API_URL}/grades/export`,
      {
        student_id: studentId,
        module_id: moduleId,
        grade: gradeData,
      },
      {
        headers: {
          'Authorization': `Bearer ${LMS_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );

    return response.data;
  } catch (error) {
    console.error('LMS grade export error:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  authenticateWithLMS,
  syncProgressToLMS,
  checkEnrollment,
  exportGradesToLMS,
};
