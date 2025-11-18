import express from 'express';
import Database from '../models/Database.js';
import { authenticateToken } from './auth.js';

const router = express.Router();
const dbManager = new Database();
const db = dbManager.getDb();

/**
 * POST /api/attempts
 * Submit an attempt
 */
router.post('/', authenticateToken, (req, res) => {
  try {
    const { problemId, answer, timeSpent } = req.body;
    const studentId = req.user.userId;

    // Validation
    if (!problemId || answer === undefined) {
      return res.status(400).json({
        error: 'Problem ID and answer are required'
      });
    }

    // Get problem to check answer
    const problem = db.prepare('SELECT expected_answer FROM problems WHERE id = ?').get(problemId);

    if (!problem) {
      return res.status(404).json({
        error: 'Problem not found'
      });
    }

    const isCorrect = parseInt(answer) === problem.expected_answer ? 1 : 0;

    // Insert attempt
    const result = db.prepare(`
      INSERT INTO attempts (student_id, problem_id, answer, is_correct, time_spent)
      VALUES (?, ?, ?, ?, ?)
    `).run(studentId, problemId, answer, isCorrect, timeSpent || null);

    // Update progress
    updateProgress(studentId);

    res.status(201).json({
      attemptId: result.lastInsertRowid,
      studentId,
      problemId,
      answer,
      isCorrect: Boolean(isCorrect),
      submittedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Submit attempt error:', error);
    res.status(500).json({
      error: 'Failed to submit attempt'
    });
  }
});

/**
 * GET /api/attempts/problem/:problemId
 * Get attempt history for a specific problem
 */
router.get('/problem/:problemId', authenticateToken, (req, res) => {
  try {
    const { problemId } = req.params;
    const studentId = req.user.userId;

    const attempts = db.prepare(`
      SELECT id, answer, is_correct, time_spent, submitted_at
      FROM attempts
      WHERE student_id = ? AND problem_id = ?
      ORDER BY submitted_at DESC
    `).all(studentId, problemId);

    const formattedAttempts = attempts.map(a => ({
      attemptId: a.id,
      answer: a.answer,
      isCorrect: Boolean(a.is_correct),
      timeSpent: a.time_spent,
      submittedAt: a.submitted_at
    }));

    res.json(formattedAttempts);

  } catch (error) {
    console.error('Get attempts error:', error);
    res.status(500).json({
      error: 'Failed to fetch attempts'
    });
  }
});

/**
 * GET /api/attempts/student/:studentId
 * Get all attempts for a student (admin/teacher only)
 */
router.get('/student/:studentId', authenticateToken, (req, res) => {
  try {
    const { studentId } = req.params;

    // Only allow if requesting own data or is teacher/admin
    if (req.user.userId !== parseInt(studentId) &&
        req.user.role !== 'teacher' &&
        req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    const attempts = db.prepare(`
      SELECT a.*, p.title as problem_title
      FROM attempts a
      JOIN problems p ON a.problem_id = p.id
      WHERE a.student_id = ?
      ORDER BY a.submitted_at DESC
    `).all(studentId);

    const formattedAttempts = attempts.map(a => ({
      attemptId: a.id,
      problemId: a.problem_id,
      problemTitle: a.problem_title,
      answer: a.answer,
      isCorrect: Boolean(a.is_correct),
      timeSpent: a.time_spent,
      submittedAt: a.submitted_at
    }));

    res.json(formattedAttempts);

  } catch (error) {
    console.error('Get student attempts error:', error);
    res.status(500).json({
      error: 'Failed to fetch attempts'
    });
  }
});

/**
 * GET /api/attempts/stats
 * Get attempt statistics for current user
 */
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const studentId = req.user.userId;

    const stats = db.prepare(`
      SELECT
        COUNT(DISTINCT problem_id) as total_problems_attempted,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as total_correct_attempts,
        COUNT(*) as total_attempts,
        AVG(time_spent) as avg_time_spent
      FROM attempts
      WHERE student_id = ?
    `).get(studentId);

    res.json({
      totalProblemsAttempted: stats.total_problems_attempted || 0,
      totalCorrectAttempts: stats.total_correct_attempts || 0,
      totalAttempts: stats.total_attempts || 0,
      avgTimeSpent: stats.avg_time_spent || 0
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics'
    });
  }
});

/**
 * Helper function to update student progress
 */
function updateProgress(studentId) {
  const stats = db.prepare(`
    SELECT
      COUNT(DISTINCT problem_id) as total_attempted,
      COUNT(DISTINCT CASE WHEN is_correct = 1 THEN problem_id END) as total_correct,
      COUNT(*) as total_attempts
    FROM attempts
    WHERE student_id = ?
  `).get(studentId);

  db.prepare(`
    INSERT INTO progress (student_id, total_problems_attempted, total_problems_correct, total_attempts)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(student_id) DO UPDATE SET
      total_problems_attempted = excluded.total_problems_attempted,
      total_problems_correct = excluded.total_problems_correct,
      total_attempts = excluded.total_attempts,
      last_activity = CURRENT_TIMESTAMP
  `).run(studentId, stats.total_attempted, stats.total_correct, stats.total_attempts);
}

export default router;
