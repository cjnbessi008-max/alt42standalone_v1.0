/**
 * Concepts API Routes
 */

import express from 'express';
import { db } from '../server.js';

const router = express.Router();

// GET all concepts
router.get('/', (req, res) => {
  try {
    const { category, difficulty_level } = req.query;

    let query = 'SELECT * FROM concepts WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (difficulty_level) {
      query += ' AND difficulty_level = ?';
      params.push(difficulty_level);
    }

    query += ' ORDER BY category, name';

    const concepts = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: concepts,
      count: concepts.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET concept by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const concept = db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM concept_problem_mappings WHERE concept_id = c.id) as problem_count,
        pc.name as parent_name
      FROM concepts c
      LEFT JOIN concepts pc ON c.parent_concept_id = pc.id
      WHERE c.id = ?
    `).get(id);

    if (!concept) {
      return res.status(404).json({
        success: false,
        error: 'Concept not found'
      });
    }

    res.json({
      success: true,
      data: concept
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET problems for a concept
router.get('/:id/problems', (req, res) => {
  try {
    const { id } = req.params;
    const includeRelated = req.query.include_related === 'true';

    let query = `
      SELECT p.*,
        cpm.relevance_score,
        cpm.is_primary,
        cpm.mapping_type
      FROM problems p
      JOIN concept_problem_mappings cpm ON p.id = cpm.problem_id
      WHERE cpm.concept_id = ?
    `;

    if (!includeRelated) {
      query += ` AND cpm.mapping_type = 'direct'`;
    }

    query += ` ORDER BY cpm.is_primary DESC, cpm.relevance_score DESC, p.difficulty_level`;

    const problems = db.prepare(query).all(id);

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

// GET prerequisites for a concept
router.get('/:id/prerequisites', (req, res) => {
  try {
    const { id } = req.params;

    const prerequisites = db.prepare(`
      SELECT c.*, cp.importance
      FROM concepts c
      JOIN concept_prerequisites cp ON c.id = cp.prerequisite_id
      WHERE cp.concept_id = ?
      ORDER BY cp.importance DESC, c.difficulty_level ASC
    `).all(id);

    res.json({
      success: true,
      data: prerequisites
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
