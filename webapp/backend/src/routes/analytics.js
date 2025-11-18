/**
 * Analytics API Routes
 */

import express from 'express';
import { db } from '../server.js';

const router = express.Router();

// GET analytics for a student
router.get('/:studentId', (req, res) => {
  try {
    const { studentId } = req.params;

    // Overall statistics
    const overall = db.prepare(`
      SELECT
        COUNT(DISTINCT problem_id) as total_problems_attempted,
        COUNT(DISTINCT concept_id) as total_concepts_studied,
        SUM(attempts) as total_attempts,
        SUM(correct_attempts) as total_correct,
        AVG(best_score) as average_score,
        SUM(time_spent) as total_time_spent,
        SUM(CASE WHEN status = 'mastered' THEN 1 ELSE 0 END) as mastered_count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count
      FROM student_progress
      WHERE student_id = ?
    `).get(studentId);

    // Performance by difficulty
    const byDifficulty = db.prepare(`
      SELECT
        p.difficulty_level,
        COUNT(*) as attempts,
        AVG(sp.best_score) as avg_score,
        SUM(CASE WHEN sp.status = 'mastered' THEN 1 ELSE 0 END) as mastered
      FROM student_progress sp
      JOIN problems p ON sp.problem_id = p.id
      WHERE sp.student_id = ?
      GROUP BY p.difficulty_level
      ORDER BY
        CASE p.difficulty_level
          WHEN 'easy' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'hard' THEN 3
        END
    `).all(studentId);

    // Performance by category
    const byCategory = db.prepare(`
      SELECT
        c.category,
        COUNT(DISTINCT sp.problem_id) as problems_attempted,
        AVG(sp.best_score) as avg_score,
        SUM(CASE WHEN sp.status = 'mastered' THEN 1 ELSE 0 END) as mastered,
        SUM(sp.time_spent) as time_spent
      FROM student_progress sp
      JOIN concepts c ON sp.concept_id = c.id
      WHERE sp.student_id = ?
      GROUP BY c.category
      ORDER BY avg_score DESC
    `).all(studentId);

    // Recent activity
    const recentActivity = db.prepare(`
      SELECT
        sp.*,
        p.title as problem_title,
        c.name as concept_name,
        c.category
      FROM student_progress sp
      JOIN problems p ON sp.problem_id = p.id
      JOIN concepts c ON sp.concept_id = c.id
      WHERE sp.student_id = ?
      ORDER BY sp.last_attempt_at DESC
      LIMIT 10
    `).all(studentId);

    // Strengths (best performing concepts)
    const strengths = db.prepare(`
      SELECT
        c.id,
        c.name,
        c.category,
        AVG(sp.best_score) as avg_score,
        COUNT(*) as problem_count,
        SUM(CASE WHEN sp.status = 'mastered' THEN 1 ELSE 0 END) as mastered_count
      FROM student_progress sp
      JOIN concepts c ON sp.concept_id = c.id
      WHERE sp.student_id = ?
      GROUP BY c.id
      HAVING avg_score >= 80
      ORDER BY avg_score DESC
      LIMIT 5
    `).all(studentId);

    // Weaknesses (struggling concepts)
    const weaknesses = db.prepare(`
      SELECT
        c.id,
        c.name,
        c.category,
        AVG(sp.best_score) as avg_score,
        SUM(sp.attempts) as total_attempts,
        COUNT(*) as problem_count
      FROM student_progress sp
      JOIN concepts c ON sp.concept_id = c.id
      WHERE sp.student_id = ?
        AND sp.status != 'mastered'
      GROUP BY c.id
      HAVING avg_score < 70
      ORDER BY avg_score ASC
      LIMIT 5
    `).all(studentId);

    // Learning velocity (concepts mastered over time)
    const learningVelocity = db.prepare(`
      SELECT
        DATE(last_attempt_at) as date,
        COUNT(DISTINCT concept_id) as concepts_active,
        SUM(CASE WHEN status = 'mastered' THEN 1 ELSE 0 END) as concepts_mastered
      FROM student_progress
      WHERE student_id = ?
        AND last_attempt_at IS NOT NULL
      GROUP BY DATE(last_attempt_at)
      ORDER BY date DESC
      LIMIT 30
    `).all(studentId);

    res.json({
      success: true,
      data: {
        overall,
        by_difficulty: byDifficulty,
        by_category: byCategory,
        recent_activity: recentActivity,
        strengths,
        weaknesses,
        learning_velocity: learningVelocity
      },
      student_id: parseInt(studentId)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET comparison with peers
router.get('/:studentId/compare', (req, res) => {
  try {
    const { studentId } = req.params;

    // Get student's grade level
    const student = db.prepare('SELECT grade_level FROM students WHERE id = ?').get(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    // Compare with peers in same grade
    const comparison = db.prepare(`
      SELECT
        AVG(sp.best_score) as peer_avg_score,
        MAX(sp.best_score) as peer_max_score,
        MIN(sp.best_score) as peer_min_score,
        COUNT(DISTINCT sp.student_id) as peer_count
      FROM student_progress sp
      JOIN students s ON sp.student_id = s.id
      WHERE s.grade_level = ?
        AND s.id != ?
    `).get(student.grade_level, studentId);

    // Get student's own stats
    const studentStats = db.prepare(`
      SELECT AVG(best_score) as avg_score
      FROM student_progress
      WHERE student_id = ?
    `).get(studentId);

    res.json({
      success: true,
      data: {
        student_avg: studentStats.avg_score,
        peer_avg: comparison.peer_avg_score,
        peer_max: comparison.peer_max_score,
        peer_min: comparison.peer_min_score,
        peer_count: comparison.peer_count,
        percentile: comparison.peer_avg_score
          ? Math.round((studentStats.avg_score / comparison.peer_avg_score) * 100)
          : null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
