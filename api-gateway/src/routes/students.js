/**
 * Students Routes
 * Handles student data and progress tracking
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const PIPELINE_URL = process.env.PIPELINE_SERVICE_URL || 'http://pipeline:8000';

// ============================================================================
// GET STUDENT PROGRESS
// ============================================================================

router.get('/:studentId/progress', async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { clip_id } = req.query;

    const response = await axios.get(
      `${PIPELINE_URL}/api/students/${studentId}/progress`,
      { params: { clip_id } }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching student progress:', error.message);
    next(error);
  }
});

// ============================================================================
// UPDATE STUDENT PROGRESS
// ============================================================================

router.post('/:studentId/progress', async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { clip_id, status, progress_percentage, time_spent_seconds, interaction_data } = req.body;

    if (!clip_id || !status) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Missing required fields: clip_id, status'
      });
    }

    const result = await pool.query(`
      INSERT INTO student_clip_progress
        (student_id, clip_id, status, progress_percentage, time_spent_seconds, last_interaction_data, started_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (student_id, clip_id)
      DO UPDATE SET
        status = EXCLUDED.status,
        progress_percentage = EXCLUDED.progress_percentage,
        time_spent_seconds = student_clip_progress.time_spent_seconds + EXCLUDED.time_spent_seconds,
        last_interaction_data = EXCLUDED.last_interaction_data,
        updated_at = NOW(),
        completed_at = CASE WHEN EXCLUDED.status = 'completed' THEN NOW() ELSE student_clip_progress.completed_at END,
        attempts_count = student_clip_progress.attempts_count + 1
      RETURNING *
    `, [
      studentId,
      clip_id,
      status,
      progress_percentage || 0,
      time_spent_seconds || 0,
      JSON.stringify(interaction_data || {})
    ]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating student progress:', error.message);
    next(error);
  }
});

// ============================================================================
// GET STUDENT INFO
// ============================================================================

router.get('/:studentId', async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const result = await pool.query(`
      SELECT id, name, email, grade_level, enrolled_modules, learning_preferences, created_at
      FROM students
      WHERE id = $1
    `, [studentId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Student not found'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching student:', error.message);
    next(error);
  }
});

// ============================================================================
// LIST STUDENTS
// ============================================================================

router.get('/', async (req, res, next) => {
  try {
    const { grade_level, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM students WHERE 1=1';
    const params = [];

    if (grade_level) {
      params.push(grade_level);
      query += ` AND grade_level = $${params.length}`;
    }

    query += ` ORDER BY name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      students: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error listing students:', error.message);
    next(error);
  }
});

module.exports = router;
