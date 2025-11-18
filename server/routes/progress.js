import express from 'express';
import Database from '../models/Database.js';
import { authenticateToken } from './auth.js';

const router = express.Router();
const dbManager = new Database();
const db = dbManager.getDb();

/**
 * GET /api/progress
 * Get progress for current user
 */
router.get('/', authenticateToken, (req, res) => {
  try {
    const studentId = req.user.userId;

    let progress = db.prepare('SELECT * FROM progress WHERE student_id = ?').get(studentId);

    if (!progress) {
      // Create initial progress record
      progress = {
        student_id: studentId,
        total_problems_attempted: 0,
        total_problems_correct: 0,
        total_attempts: 0,
        last_activity: new Date().toISOString()
      };
    }

    res.json({
      studentId: progress.student_id,
      totalProblemsAttempted: progress.total_problems_attempted,
      totalProblemsCorrect: progress.total_problems_correct,
      totalAttempts: progress.total_attempts,
      successRate: progress.total_problems_attempted > 0
        ? Math.round((progress.total_problems_correct / progress.total_problems_attempted) * 100)
        : 0,
      lastActivity: progress.last_activity
    });

  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({
      error: 'Failed to fetch progress'
    });
  }
});

/**
 * GET /api/progress/leaderboard
 * Get leaderboard (top students)
 */
router.get('/leaderboard', authenticateToken, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const leaderboard = db.prepare(`
      SELECT
        u.id,
        u.username,
        u.firstname,
        u.lastname,
        p.total_problems_correct,
        p.total_problems_attempted,
        p.total_attempts,
        CAST(p.total_problems_correct AS FLOAT) / NULLIF(p.total_problems_attempted, 0) * 100 as success_rate
      FROM users u
      JOIN progress p ON u.id = p.student_id
      WHERE u.role = 'student'
      ORDER BY p.total_problems_correct DESC, p.total_attempts ASC
      LIMIT ?
    `).all(limit);

    const formattedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      studentId: entry.id,
      username: entry.username,
      name: `${entry.firstname} ${entry.lastname}`,
      totalProblemsCorrect: entry.total_problems_correct,
      totalProblemsAttempted: entry.total_problems_attempted,
      totalAttempts: entry.total_attempts,
      successRate: entry.success_rate ? Math.round(entry.success_rate) : 0
    }));

    res.json(formattedLeaderboard);

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      error: 'Failed to fetch leaderboard'
    });
  }
});

/**
 * GET /api/progress/student/:studentId
 * Get progress for specific student (admin/teacher only)
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

    const progress = db.prepare(`
      SELECT p.*, u.username, u.firstname, u.lastname
      FROM progress p
      JOIN users u ON p.student_id = u.id
      WHERE p.student_id = ?
    `).get(studentId);

    if (!progress) {
      return res.status(404).json({
        error: 'Progress not found'
      });
    }

    res.json({
      studentId: progress.student_id,
      username: progress.username,
      name: `${progress.firstname} ${progress.lastname}`,
      totalProblemsAttempted: progress.total_problems_attempted,
      totalProblemsCorrect: progress.total_problems_correct,
      totalAttempts: progress.total_attempts,
      successRate: progress.total_problems_attempted > 0
        ? Math.round((progress.total_problems_correct / progress.total_problems_attempted) * 100)
        : 0,
      lastActivity: progress.last_activity
    });

  } catch (error) {
    console.error('Get student progress error:', error);
    res.status(500).json({
      error: 'Failed to fetch student progress'
    });
  }
});

/**
 * GET /api/progress/overview
 * Get overview statistics (admin/teacher only)
 */
router.get('/overview', authenticateToken, (req, res) => {
  try {
    // Check if user is teacher or admin
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    const overview = db.prepare(`
      SELECT
        COUNT(DISTINCT u.id) as total_students,
        COUNT(DISTINCT p.id) as total_problems,
        COUNT(DISTINCT a.id) as total_attempts,
        AVG(CAST(pr.total_problems_correct AS FLOAT) / NULLIF(pr.total_problems_attempted, 0)) * 100 as avg_success_rate
      FROM users u
      LEFT JOIN attempts a ON u.id = a.student_id
      CROSS JOIN problems p
      LEFT JOIN progress pr ON u.id = pr.student_id
      WHERE u.role = 'student'
    `).get();

    res.json({
      totalStudents: overview.total_students || 0,
      totalProblems: overview.total_problems || 0,
      totalAttempts: overview.total_attempts || 0,
      avgSuccessRate: overview.avg_success_rate ? Math.round(overview.avg_success_rate) : 0
    });

  } catch (error) {
    console.error('Get overview error:', error);
    res.status(500).json({
      error: 'Failed to fetch overview'
    });
  }
});

export default router;
