/**
 * Recommendations API Routes
 */

import express from 'express';
import { db } from '../server.js';
import { RecommendationEngine } from '../services/recommendationEngine.js';

const router = express.Router();

// GET recommendations for a student
router.get('/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const minConfidence = parseFloat(req.query.min_confidence) || 0.5;
    const algorithm = req.query.algorithm; // optional: 'content', 'collaborative', 'knowledge_graph', 'hybrid'

    // Check if student exists
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    // Generate recommendations
    const engine = new RecommendationEngine(db);
    const recommendations = await engine.getRecommendations(
      parseInt(studentId),
      limit,
      minConfidence
    );

    // Filter by algorithm if specified
    let filtered = recommendations;
    if (algorithm && algorithm !== 'hybrid') {
      filtered = recommendations.filter(rec =>
        rec.supporting_algorithms.includes(algorithm)
      );
    }

    // Enrich with problem details
    const enriched = filtered.map(rec => {
      const problem = db.prepare('SELECT * FROM problems WHERE id = ?').get(rec.problem_id);
      const concept = db.prepare('SELECT * FROM concepts WHERE id = ?').get(rec.concept_id);

      return {
        ...rec,
        problem,
        concept
      };
    });

    // Optionally save recommendations to database
    if (req.query.save === 'true') {
      engine.saveRecommendations(recommendations);
    }

    res.json({
      success: true,
      data: enriched,
      count: enriched.length,
      student: {
        id: student.id,
        name: student.name
      },
      filters: {
        limit,
        min_confidence: minConfidence,
        algorithm: algorithm || 'hybrid'
      }
    });
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET recommendation history
router.get('/:studentId/history', (req, res) => {
  try {
    const { studentId } = req.params;

    const history = db.prepare(`
      SELECT r.*,
        p.title as problem_title,
        c.name as concept_name
      FROM recommendations r
      JOIN problems p ON r.problem_id = p.id
      LEFT JOIN concepts c ON r.concept_id = c.id
      WHERE r.student_id = ?
      ORDER BY r.created_at DESC
      LIMIT 50
    `).all(studentId);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
