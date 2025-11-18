/**
 * Problems API Routes
 */

import express from 'express';
import { db } from '../server.js';

const router = express.Router();

// GET all problems
router.get('/', (req, res) => {
  try {
    const { difficulty_level, problem_type, concept_id } = req.query;

    let query = 'SELECT * FROM problems WHERE 1=1';
    const params = [];

    if (difficulty_level) {
      query += ' AND difficulty_level = ?';
      params.push(difficulty_level);
    }

    if (problem_type) {
      query += ' AND problem_type = ?';
      params.push(problem_type);
    }

    if (concept_id) {
      query = `
        SELECT DISTINCT p.*
        FROM problems p
        JOIN concept_problem_mappings cpm ON p.id = cpm.problem_id
        WHERE cpm.concept_id = ?
      `;
      params.length = 0;
      params.push(concept_id);
    }

    query += ' ORDER BY difficulty_level, title';

    const problems = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: problems,
      count: problems.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET problem by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const problem = db.prepare('SELECT * FROM problems WHERE id = ?').get(id);

    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }

    res.json({
      success: true,
      data: problem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET concepts for a problem
router.get('/:id/concepts', (req, res) => {
  try {
    const { id } = req.params;

    const concepts = db.prepare(`
      SELECT c.*,
        cpm.relevance_score,
        cpm.is_primary,
        cpm.mapping_type
      FROM concepts c
      JOIN concept_problem_mappings cpm ON c.id = cpm.concept_id
      WHERE cpm.problem_id = ?
      ORDER BY cpm.is_primary DESC, cpm.relevance_score DESC
    `).all(id);

    res.json({
      success: true,
      data: concepts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
