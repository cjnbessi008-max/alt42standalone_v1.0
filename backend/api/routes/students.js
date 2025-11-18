/**
 * Students Routes
 * Handles student data and progress tracking
 */

const express = require('express')
const router = express.Router()
const db = require('../database/connection')

/**
 * GET /api/students
 * Get all students
 */
router.get('/', async (req, res) => {
  try {
    const { courseId } = req.query

    let query = 'SELECT * FROM students'
    let params = []

    if (courseId) {
      query += ' WHERE course_id = ?'
      params.push(courseId)
    }

    const [rows] = await db.query(query, params)

    res.json({
      success: true,
      data: rows
    })
  } catch (error) {
    console.error('Error fetching students:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /api/students/:id
 * Get student by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const studentId = req.params.id

    const [rows] = await db.query(
      'SELECT * FROM students WHERE id = ?',
      [studentId]
    )

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      })
    }

    res.json({
      success: true,
      data: rows[0]
    })
  } catch (error) {
    console.error('Error fetching student:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/students
 * Create new student
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, courseId, moodleUserId } = req.body

    const [result] = await db.query(
      'INSERT INTO students (name, email, course_id, moodle_user_id, created_at) VALUES (?, ?, ?, ?, NOW())',
      [name, email, courseId, moodleUserId]
    )

    res.json({
      success: true,
      data: {
        id: result.insertId,
        name,
        email,
        courseId,
        moodleUserId
      }
    })
  } catch (error) {
    console.error('Error creating student:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /api/students/:id/progress
 * Get student progress
 */
router.get('/:id/progress', async (req, res) => {
  try {
    const studentId = req.params.id

    // Get problem statistics
    const [stats] = await db.query(
      `SELECT
        COUNT(DISTINCT p.id) as total_problems,
        COUNT(DISTINCT CASE WHEN a.correct = 1 THEN p.id END) as correct_problems,
        AVG(CASE WHEN a.correct = 1 THEN 100 ELSE 0 END) as accuracy,
        COUNT(DISTINCT DATE(p.created_at)) as days_active
       FROM problems p
       LEFT JOIN answers a ON p.id = a.problem_id
       WHERE p.student_id = ?`,
      [studentId]
    )

    // Get recent activity
    const [recentActivity] = await db.query(
      `SELECT p.*, a.correct, a.submitted_at
       FROM problems p
       LEFT JOIN answers a ON p.id = a.problem_id
       WHERE p.student_id = ?
       ORDER BY p.created_at DESC
       LIMIT 5`,
      [studentId]
    )

    res.json({
      success: true,
      data: {
        statistics: stats[0],
        recentActivity
      }
    })
  } catch (error) {
    console.error('Error fetching progress:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

module.exports = router
