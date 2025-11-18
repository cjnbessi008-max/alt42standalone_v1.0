/**
 * Students API Routes
 */

import express from 'express';
import { db } from '../server.js';

const router = express.Router();

// GET all students
router.get('/', (req, res) => {
  try {
    const students = db.prepare(`
      SELECT s.*,
        COUNT(DISTINCT sp.problem_id) as problems_attempted,
        SUM(CASE WHEN sp.status = 'mastered' THEN 1 ELSE 0 END) as problems_mastered,
        AVG(sp.best_score) as avg_score
      FROM students s
      LEFT JOIN student_progress sp ON s.id = sp.student_id
      GROUP BY s.id
      ORDER BY s.name
    `).all();

    res.json({
      success: true,
      data: students,
      count: students.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET student by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const student = db.prepare(`
      SELECT s.*,
        COUNT(DISTINCT sp.problem_id) as problems_attempted,
        SUM(CASE WHEN sp.status = 'mastered' THEN 1 ELSE 0 END) as problems_mastered,
        AVG(sp.best_score) as avg_score,
        SUM(sp.time_spent) as total_time_spent
      FROM students s
      LEFT JOIN student_progress sp ON s.id = sp.student_id
      WHERE s.id = ?
      GROUP BY s.id
    `).get(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST create new student
router.post('/', (req, res) => {
  try {
    const { name, email, grade_level, learning_style } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Name and email are required'
      });
    }

    const result = db.prepare(`
      INSERT INTO students (name, email, grade_level, learning_style)
      VALUES (?, ?, ?, ?)
    `).run(name, email, grade_level, learning_style);

    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      data: student
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint')) {
      return res.status(409).json({
        success: false,
        error: 'Email already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
