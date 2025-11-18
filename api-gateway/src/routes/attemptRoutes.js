const express = require('express');
const { Pool } = require('pg');
const config = require('../config/config');
const logger = require('../utils/logger');

const router = express.Router();
const pool = new Pool(config.database);

/**
 * POST /api/v1/attempts
 * Submit a student attempt
 */
router.post('/', async (req, res, next) => {
  const { problem_id, student_id, attempted_inverse, is_correct, interaction_log, time_spent_seconds } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO ai_education.student_attempts
      (problem_id, student_id, attempted_inverse, is_correct, interaction_log, time_spent_seconds)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [problem_id, student_id, attempted_inverse, is_correct, JSON.stringify(interaction_log || []), time_spent_seconds || 0]
    );

    // Emit real-time event
    const io = req.app.get('io');
    io.to(`problem_${problem_id}`).emit('attempt_submitted', result.rows[0]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error submitting attempt:', error.message);
    next(error);
  }
});

/**
 * GET /api/v1/attempts/student/:student_id
 * Get all attempts for a student
 */
router.get('/student/:student_id', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM ai_education.student_attempts
       WHERE student_id = $1
       ORDER BY attempted_at DESC`,
      [req.params.student_id]
    );

    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching student attempts:', error.message);
    next(error);
  }
});

module.exports = router;
