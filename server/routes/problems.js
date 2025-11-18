import express from 'express';
import Database from '../models/Database.js';
import { authenticateToken } from './auth.js';

const router = express.Router();
const dbManager = new Database();
const db = dbManager.getDb();

/**
 * GET /api/problems
 * Get all problems
 */
router.get('/', authenticateToken, (req, res) => {
  try {
    const { difficulty, limit = 100 } = req.query;

    let query = 'SELECT * FROM problems';
    const params = [];

    if (difficulty) {
      query += ' WHERE difficulty = ?';
      params.push(difficulty);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const problems = db.prepare(query).all(...params);

    // Parse data_array JSON
    const formattedProblems = problems.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      dataArray: JSON.parse(p.data_array),
      expectedAnswer: p.expected_answer,
      difficulty: p.difficulty,
      createdAt: p.created_at,
      updatedAt: p.updated_at
    }));

    res.json(formattedProblems);

  } catch (error) {
    console.error('Get problems error:', error);
    res.status(500).json({
      error: 'Failed to fetch problems'
    });
  }
});

/**
 * GET /api/problems/:id
 * Get a single problem by ID
 */
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    const problem = db.prepare('SELECT * FROM problems WHERE id = ?').get(id);

    if (!problem) {
      return res.status(404).json({
        error: 'Problem not found'
      });
    }

    res.json({
      id: problem.id,
      title: problem.title,
      description: problem.description,
      dataArray: JSON.parse(problem.data_array),
      expectedAnswer: problem.expected_answer,
      difficulty: problem.difficulty,
      createdAt: problem.created_at,
      updatedAt: problem.updated_at
    });

  } catch (error) {
    console.error('Get problem error:', error);
    res.status(500).json({
      error: 'Failed to fetch problem'
    });
  }
});

/**
 * POST /api/problems
 * Create a new problem (requires teacher/admin role)
 */
router.post('/', authenticateToken, (req, res) => {
  try {
    // Check if user is teacher or admin
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Only teachers and admins can create problems'
      });
    }

    const { title, description, dataArray, expectedAnswer, difficulty = 'medium' } = req.body;

    // Validation
    if (!title || !description || !dataArray || expectedAnswer === undefined) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      return res.status(400).json({
        error: 'dataArray must be a non-empty array'
      });
    }

    const result = db.prepare(`
      INSERT INTO problems (title, description, data_array, expected_answer, difficulty, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      title,
      description,
      JSON.stringify(dataArray),
      expectedAnswer,
      difficulty,
      req.user.userId
    );

    res.status(201).json({
      message: 'Problem created successfully',
      problem: {
        id: result.lastInsertRowid,
        title,
        description,
        dataArray,
        expectedAnswer,
        difficulty
      }
    });

  } catch (error) {
    console.error('Create problem error:', error);
    res.status(500).json({
      error: 'Failed to create problem'
    });
  }
});

/**
 * PUT /api/problems/:id
 * Update a problem (requires teacher/admin role)
 */
router.put('/:id', authenticateToken, (req, res) => {
  try {
    // Check if user is teacher or admin
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Only teachers and admins can update problems'
      });
    }

    const { id } = req.params;
    const { title, description, dataArray, expectedAnswer, difficulty } = req.body;

    // Check if problem exists
    const existing = db.prepare('SELECT id FROM problems WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({
        error: 'Problem not found'
      });
    }

    const updates = [];
    const params = [];

    if (title) {
      updates.push('title = ?');
      params.push(title);
    }
    if (description) {
      updates.push('description = ?');
      params.push(description);
    }
    if (dataArray) {
      updates.push('data_array = ?');
      params.push(JSON.stringify(dataArray));
    }
    if (expectedAnswer !== undefined) {
      updates.push('expected_answer = ?');
      params.push(expectedAnswer);
    }
    if (difficulty) {
      updates.push('difficulty = ?');
      params.push(difficulty);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    db.prepare(`
      UPDATE problems
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...params);

    res.json({
      message: 'Problem updated successfully'
    });

  } catch (error) {
    console.error('Update problem error:', error);
    res.status(500).json({
      error: 'Failed to update problem'
    });
  }
});

/**
 * DELETE /api/problems/:id
 * Delete a problem (requires admin role)
 */
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Only admins can delete problems'
      });
    }

    const { id } = req.params;

    const result = db.prepare('DELETE FROM problems WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({
        error: 'Problem not found'
      });
    }

    res.json({
      message: 'Problem deleted successfully'
    });

  } catch (error) {
    console.error('Delete problem error:', error);
    res.status(500).json({
      error: 'Failed to delete problem'
    });
  }
});

export default router;
