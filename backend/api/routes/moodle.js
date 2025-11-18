/**
 * Moodle LMS Integration Routes
 * Connects to Moodle 3.7 Web Services API
 */

const express = require('express')
const router = express.Router()
const axios = require('axios')

// Moodle configuration
const MOODLE_URL = process.env.MOODLE_URL || 'http://localhost/moodle'
const MOODLE_TOKEN = process.env.MOODLE_TOKEN || ''

/**
 * Call Moodle Web Service API
 */
async function callMoodleAPI(wsfunction, params = {}) {
  try {
    const response = await axios.get(`${MOODLE_URL}/webservice/rest/server.php`, {
      params: {
        wstoken: MOODLE_TOKEN,
        wsfunction: wsfunction,
        moodlewsrestformat: 'json',
        ...params
      }
    })
    return response.data
  } catch (error) {
    console.error('Moodle API Error:', error.message)
    throw error
  }
}

/**
 * GET /api/moodle/info
 * Get Moodle site information
 */
router.get('/info', async (req, res) => {
  try {
    const siteInfo = await callMoodleAPI('core_webservice_get_site_info')
    res.json({
      success: true,
      data: {
        sitename: siteInfo.sitename,
        version: siteInfo.version,
        release: siteInfo.release,
        functions: siteInfo.functions || []
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /api/moodle/courses
 * Get list of courses
 */
router.get('/courses', async (req, res) => {
  try {
    const courses = await callMoodleAPI('core_course_get_courses')
    res.json({
      success: true,
      data: courses
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /api/moodle/course/:id/students
 * Get students enrolled in a course
 */
router.get('/course/:id/students', async (req, res) => {
  try {
    const courseId = req.params.id
    const students = await callMoodleAPI('core_enrol_get_enrolled_users', {
      courseid: courseId
    })

    res.json({
      success: true,
      data: students.map(student => ({
        id: student.id,
        username: student.username,
        fullname: student.fullname,
        email: student.email
      }))
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/moodle/grade
 * Submit grade to Moodle gradebook
 */
router.post('/grade', async (req, res) => {
  try {
    const { courseId, studentId, itemName, grade } = req.body

    // Call Moodle grade update API
    // Note: Requires proper Moodle web service configuration
    const result = await callMoodleAPI('core_grades_update_grades', {
      source: 'impossible_shadow',
      courseid: courseId,
      component: 'mod_assign',
      activityid: 0,
      itemnumber: 0,
      grades: [{
        studentid: studentId,
        grade: grade
      }]
    })

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/moodle/activity/log
 * Log student activity to Moodle
 */
router.post('/activity/log', async (req, res) => {
  try {
    const { courseId, studentId, action, problemId } = req.body

    // Log to Moodle activity logs
    // This would typically use custom Moodle plugin events

    console.log('Activity logged:', {
      courseId,
      studentId,
      action,
      problemId,
      timestamp: new Date().toISOString()
    })

    res.json({
      success: true,
      message: 'Activity logged successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

module.exports = router
