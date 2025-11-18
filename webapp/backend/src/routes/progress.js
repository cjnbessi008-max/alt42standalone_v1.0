/**
 * Student Progress API Routes
 */

import express from 'express';
import { db } from '../server.js';

const router = express.Router();

// GET progress for a student
router.get('/:studentId', (req, res) => {
  try {
    const { studentId } = req.params;
    const { concept_id } = req.query;

    let query = `
      SELECT sp.*,
        c.name as concept_name,
        c.category,
        p.title as problem_title,
        p.difficulty_level as problem_difficulty,
        p.points
      FROM student_progress sp
      JOIN concepts c ON sp.concept_id = c.id
      JOIN problems p ON sp.problem_id = p.id
      WHERE sp.student_id = ?
    `;

    const params = [studentId];

    if (concept_id) {
      query += ' AND sp.concept_id = ?';
      params.push(concept_id);
    }

    query += ' ORDER BY sp.last_attempt_at DESC';

    const progress = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: progress,
      count: progress.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST record/update progress
router.post('/:studentId', (req, res) => {
  try {
    const { studentId } = req.params;
    const { problem_id, concept_id, score, time_spent } = req.body;

    if (!problem_id || !concept_id) {
      return res.status(400).json({
        success: false,
        error: 'problem_id and concept_id are required'
      });
    }

    // Get existing progress
    const existing = db.prepare(`
      SELECT * FROM student_progress
      WHERE student_id = ? AND problem_id = ? AND concept_id = ?
    `).get(studentId, problem_id, concept_id);

    let result;
    if (existing) {
      // Update existing progress
      const newAttempts = existing.attempts + 1;
      const newCorrect = existing.correct_attempts + (score >= 80 ? 1 : 0);
      const newBestScore = Math.max(existing.best_score || 0, score || 0);

      let status = existing.status;
      if (newBestScore >= 90 && newCorrect >= 2) {
        status = 'mastered';
      } else if (newBestScore >= 70) {
        status = 'completed';
      } else {
        status = 'in_progress';
      }

      result = db.prepare(`
        UPDATE student_progress
        SET attempts = ?,
            correct_attempts = ?,
            last_score = ?,
            best_score = ?,
            time_spent = time_spent + ?,
            status = ?,
            last_attempt_at = datetime('now'),
            updated_at = datetime('now')
        WHERE student_id = ? AND problem_id = ? AND concept_id = ?
      `).run(
        newAttempts,
        newCorrect,
        score,
        newBestScore,
        time_spent || 0,
        status,
        studentId,
        problem_id,
        concept_id
      );
    } else {
      // Insert new progress
      const status = score >= 90 ? 'completed' : score >= 70 ? 'in_progress' : 'not_started';

      result = db.prepare(`
        INSERT INTO student_progress (
          student_id, problem_id, concept_id,
          attempts, correct_attempts, last_score, best_score,
          time_spent, status, first_attempt_at, last_attempt_at
        ) VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(
        studentId,
        problem_id,
        concept_id,
        score >= 80 ? 1 : 0,
        score,
        score,
        time_spent || 0,
        status
      );
    }

    // Get updated progress
    const updated = db.prepare(`
      SELECT sp.*,
        c.name as concept_name,
        p.title as problem_title
      FROM student_progress sp
      JOIN concepts c ON sp.concept_id = c.id
      JOIN problems p ON sp.problem_id = p.id
      WHERE sp.student_id = ? AND sp.problem_id = ? AND sp.concept_id = ?
    `).get(studentId, problem_id, concept_id);

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET concept mastery stats for a student
router.get('/:studentId/concepts', (req, res) => {
  try {
    const { studentId } = req.params;

    const stats = db.prepare(`
      SELECT
        c.id as concept_id,
        c.name as concept_name,
        c.category,
        c.difficulty_level,
        COUNT(DISTINCT sp.problem_id) as problems_attempted,
        SUM(CASE WHEN sp.status = 'mastered' THEN 1 ELSE 0 END) as problems_mastered,
        SUM(CASE WHEN sp.status = 'completed' THEN 1 ELSE 0 END) as problems_completed,
        AVG(sp.best_score) as average_score,
        MAX(sp.best_score) as max_score,
        SUM(sp.time_spent) as total_time_spent,
        MAX(sp.last_attempt_at) as last_activity
      FROM concepts c
      LEFT JOIN student_progress sp ON c.id = sp.concept_id AND sp.student_id = ?
      GROUP BY c.id, c.name, c.category, c.difficulty_level
      HAVING problems_attempted > 0
      ORDER BY c.category, c.name
    `).all(studentId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
