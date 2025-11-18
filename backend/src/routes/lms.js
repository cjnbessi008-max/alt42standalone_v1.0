import express from 'express';
import { query } from '../config/database.js';

const router = express.Router();

// POST /api/lms/sync-student - Sync student from Moodle LMS
router.post('/sync-student', async (req, res) => {
  try {
    const { moodle_user_id, name, email, grade_level } = req.body;

    if (!moodle_user_id || !name) {
      return res.status(400).json({
        success: false,
        error: 'moodle_user_id and name are required',
      });
    }

    // Check if student already exists
    const existingStudent = await query(
      'SELECT * FROM students WHERE moodle_user_id = $1',
      [moodle_user_id]
    );

    let result;
    if (existingStudent.rows.length > 0) {
      // Update existing student
      result = await query(
        `
        UPDATE students
        SET name = $1, email = $2, grade_level = $3, updated_at = CURRENT_TIMESTAMP
        WHERE moodle_user_id = $4
        RETURNING *
        `,
        [name, email, grade_level, moodle_user_id]
      );
    } else {
      // Insert new student
      result = await query(
        `
        INSERT INTO students (moodle_user_id, name, email, grade_level)
        VALUES ($1, $2, $3, $4)
        RETURNING *
        `,
        [moodle_user_id, name, email, grade_level]
      );
    }

    res.json({
      success: true,
      action: existingStudent.rows.length > 0 ? 'updated' : 'created',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error syncing student:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync student',
      message: error.message,
    });
  }
});

// GET /api/lms/student/:moodleUserId - Get student by Moodle user ID
router.get('/student/:moodleUserId', async (req, res) => {
  try {
    const { moodleUserId } = req.params;

    const result = await query(
      'SELECT * FROM students WHERE moodle_user_id = $1',
      [moodleUserId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Student not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch student',
      message: error.message,
    });
  }
});

// GET /api/lms/student/:moodleUserId/progress - Get student progress
router.get('/student/:moodleUserId/progress', async (req, res) => {
  try {
    const { moodleUserId } = req.params;

    // Get student ID
    const studentResult = await query(
      'SELECT id FROM students WHERE moodle_user_id = $1',
      [moodleUserId]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Student not found',
      });
    }

    const studentId = studentResult.rows[0].id;

    // Get progress data
    const progressResult = await query(
      `
      SELECT
        p.id as problem_id,
        p.title,
        p.function_type,
        p.difficulty_level,
        sa.id as attempt_id,
        sa.completed_at,
        sa.time_spent_seconds,
        sa.score,
        sa.correct_derivative_identified,
        sa.shake_count
      FROM problems p
      LEFT JOIN student_attempts sa ON p.id = sa.problem_id AND sa.student_id = $1
      WHERE p.is_active = true
      ORDER BY p.difficulty_level ASC, sa.completed_at DESC
      `,
      [studentId]
    );

    // Calculate overall statistics
    const statsResult = await query(
      `
      SELECT
        COUNT(*) as total_attempts,
        COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END) as completed_attempts,
        AVG(score) as average_score,
        AVG(time_spent_seconds) as average_time,
        COUNT(CASE WHEN correct_derivative_identified THEN 1 END) as correct_count
      FROM student_attempts
      WHERE student_id = $1
      `,
      [studentId]
    );

    res.json({
      success: true,
      data: {
        student_id: studentId,
        moodle_user_id: moodleUserId,
        attempts: progressResult.rows,
        statistics: statsResult.rows[0],
      },
    });
  } catch (error) {
    console.error('Error fetching student progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch student progress',
      message: error.message,
    });
  }
});

// POST /api/lms/grade-export - Export grades to Moodle format
router.post('/grade-export', async (req, res) => {
  try {
    const { module_id } = req.body;

    if (!module_id) {
      return res.status(400).json({
        success: false,
        error: 'module_id is required',
      });
    }

    // Get all students' grades for the module
    const result = await query(
      `
      SELECT
        s.moodle_user_id,
        s.name,
        s.email,
        COUNT(sa.id) as attempts,
        AVG(sa.score) as average_score,
        MAX(sa.score) as best_score,
        SUM(sa.time_spent_seconds) as total_time_seconds
      FROM students s
      JOIN student_attempts sa ON s.id = sa.student_id
      JOIN problems p ON sa.problem_id = p.id
      WHERE p.module_id = $1 AND sa.completed_at IS NOT NULL
      GROUP BY s.id, s.moodle_user_id, s.name, s.email
      ORDER BY s.name
      `,
      [module_id]
    );

    // Format for Moodle grade export (CSV format)
    const grades = result.rows.map(row => ({
      moodle_user_id: row.moodle_user_id,
      name: row.name,
      email: row.email,
      grade: row.best_score || 0, // Use best score as final grade
      attempts: row.attempts,
      average_score: parseFloat(row.average_score || 0).toFixed(2),
      total_time_minutes: Math.round((row.total_time_seconds || 0) / 60),
    }));

    res.json({
      success: true,
      count: grades.length,
      data: grades,
    });
  } catch (error) {
    console.error('Error exporting grades:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export grades',
      message: error.message,
    });
  }
});

// POST /api/lms/webhook - Webhook endpoint for Moodle events
router.post('/webhook', async (req, res) => {
  try {
    const { event_type, user_id, course_id, data } = req.body;

    console.log('Received Moodle webhook:', {
      event_type,
      user_id,
      course_id,
      timestamp: new Date().toISOString(),
    });

    // Handle different event types
    switch (event_type) {
      case 'user_enrolled':
        // Sync the newly enrolled student
        await query(
          `
          INSERT INTO students (moodle_user_id, name, email)
          VALUES ($1, $2, $3)
          ON CONFLICT (moodle_user_id) DO NOTHING
          `,
          [user_id, data?.name || 'Unknown', data?.email || null]
        );
        break;

      case 'course_completed':
        // Mark all attempts as completed or trigger some action
        console.log(`Course ${course_id} completed by user ${user_id}`);
        break;

      default:
        console.log(`Unhandled event type: ${event_type}`);
    }

    res.json({
      success: true,
      message: 'Webhook processed successfully',
      event_type,
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process webhook',
      message: error.message,
    });
  }
});

// GET /api/lms/modules - Get all available modules
router.get('/modules', async (req, res) => {
  try {
    const result = await query(
      `
      SELECT
        m.*,
        t.name as teacher_name,
        COUNT(p.id) as problem_count
      FROM modules m
      LEFT JOIN teachers t ON m.teacher_id = t.id
      LEFT JOIN problems p ON m.id = p.module_id AND p.is_active = true
      WHERE m.is_active = true
      GROUP BY m.id, t.name
      ORDER BY m.difficulty_level ASC
      `
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch modules',
      message: error.message,
    });
  }
});

export default router;
