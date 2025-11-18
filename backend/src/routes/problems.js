import express from 'express';
import { query } from '../config/database.js';

const router = express.Router();

// GET /api/problems - Get all problems
router.get('/', async (req, res) => {
  try {
    const { module_id, difficulty, function_type } = req.query;

    let queryText = `
      SELECT
        p.*,
        m.name as module_name,
        m.subject
      FROM problems p
      LEFT JOIN modules m ON p.module_id = m.id
      WHERE p.is_active = true
    `;

    const queryParams = [];
    let paramCount = 1;

    if (module_id) {
      queryText += ` AND p.module_id = $${paramCount}`;
      queryParams.push(module_id);
      paramCount++;
    }

    if (difficulty) {
      queryText += ` AND p.difficulty_level = $${paramCount}`;
      queryParams.push(difficulty);
      paramCount++;
    }

    if (function_type) {
      queryText += ` AND p.function_type = $${paramCount}`;
      queryParams.push(function_type);
      paramCount++;
    }

    queryText += ' ORDER BY p.difficulty_level ASC, p.created_at DESC';

    const result = await query(queryText, queryParams);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching problems:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch problems',
      message: error.message,
    });
  }
});

// GET /api/problems/:id - Get a specific problem
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `
      SELECT
        p.*,
        m.name as module_name,
        m.subject,
        m.description as module_description
      FROM problems p
      LEFT JOIN modules m ON p.module_id = m.id
      WHERE p.id = $1 AND p.is_active = true
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching problem:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch problem',
      message: error.message,
    });
  }
});

// POST /api/problems/:id/attempt - Start a new attempt
router.post('/:id/attempt', async (req, res) => {
  try {
    const { id } = req.params;
    const { student_id } = req.body;

    if (!student_id) {
      return res.status(400).json({
        success: false,
        error: 'student_id is required',
      });
    }

    const result = await query(
      `
      INSERT INTO student_attempts (student_id, problem_id, started_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      RETURNING *
      `,
      [student_id, id]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating attempt:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create attempt',
      message: error.message,
    });
  }
});

// POST /api/problems/:id/interaction - Record student interaction
router.post('/:id/interaction', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      attempt_id,
      interaction_type,
      shake_intensity,
      position_x,
      position_y,
      derivative_value,
    } = req.body;

    if (!attempt_id) {
      return res.status(400).json({
        success: false,
        error: 'attempt_id is required',
      });
    }

    // Update shake count if it's a shake interaction
    if (interaction_type === 'shake') {
      await query(
        'UPDATE student_attempts SET shake_count = shake_count + 1 WHERE id = $1',
        [attempt_id]
      );
    }

    const result = await query(
      `
      INSERT INTO student_interactions
        (attempt_id, interaction_type, shake_intensity, position_x, position_y, derivative_value)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [attempt_id, interaction_type, shake_intensity, position_x, position_y, derivative_value]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error recording interaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record interaction',
      message: error.message,
    });
  }
});

// PUT /api/problems/:id/attempt/:attemptId - Complete an attempt
router.put('/:id/attempt/:attemptId', async (req, res) => {
  try {
    const { attemptId } = req.params;
    const {
      correct_derivative_identified,
      score,
      feedback,
    } = req.body;

    // Calculate time spent
    const timeResult = await query(
      `SELECT EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))::INTEGER as time_spent
       FROM student_attempts WHERE id = $1`,
      [attemptId]
    );

    const timeSpent = timeResult.rows[0]?.time_spent || 0;

    const result = await query(
      `
      UPDATE student_attempts
      SET
        completed_at = CURRENT_TIMESTAMP,
        time_spent_seconds = $1,
        correct_derivative_identified = $2,
        score = $3,
        feedback = $4
      WHERE id = $5
      RETURNING *
      `,
      [timeSpent, correct_derivative_identified, score, feedback, attemptId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Attempt not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error completing attempt:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete attempt',
      message: error.message,
    });
  }
});

// GET /api/problems/:id/analytics - Get analytics for a problem
router.get('/:id/analytics', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `
      SELECT
        COUNT(DISTINCT sa.id) as total_attempts,
        COUNT(DISTINCT sa.student_id) as unique_students,
        AVG(sa.time_spent_seconds) as avg_time_seconds,
        AVG(sa.score) as avg_score,
        AVG(sa.shake_count) as avg_shake_count,
        COUNT(CASE WHEN sa.correct_derivative_identified THEN 1 END) as correct_count
      FROM student_attempts sa
      WHERE sa.problem_id = $1 AND sa.completed_at IS NOT NULL
      `,
      [id]
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
      message: error.message,
    });
  }
});

export default router;
