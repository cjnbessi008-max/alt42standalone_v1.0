/**
 * Graph Data API Routes
 * For D3.js visualization
 */

import express from 'express';
import { db } from '../server.js';

const router = express.Router();

// GET graph data (nodes and edges)
router.get('/', (req, res) => {
  try {
    const { category, difficulty_level, concept_id, student_id } = req.query;

    // Build concept filter
    let conceptFilter = 'WHERE 1=1';
    const conceptParams = [];

    if (category) {
      conceptFilter += ' AND category = ?';
      conceptParams.push(category);
    }

    if (difficulty_level) {
      conceptFilter += ' AND difficulty_level = ?';
      conceptParams.push(difficulty_level);
    }

    if (concept_id) {
      conceptFilter += ' AND id = ?';
      conceptParams.push(concept_id);
    }

    // Get concepts
    const concepts = db.prepare(`SELECT * FROM concepts ${conceptFilter}`).all(...conceptParams);
    const conceptIds = concepts.map(c => c.id);

    // Get problems related to these concepts
    let problems = [];
    if (conceptIds.length > 0) {
      const placeholders = conceptIds.map(() => '?').join(',');
      problems = db.prepare(`
        SELECT DISTINCT p.*
        FROM problems p
        JOIN concept_problem_mappings cpm ON p.id = cpm.problem_id
        WHERE cpm.concept_id IN (${placeholders})
      `).all(...conceptIds);
    }

    // Get mappings (edges)
    let mappings = [];
    if (conceptIds.length > 0) {
      const placeholders = conceptIds.map(() => '?').join(',');
      mappings = db.prepare(`
        SELECT
          cpm.concept_id,
          cpm.problem_id,
          cpm.relevance_score,
          cpm.is_primary,
          cpm.mapping_type,
          c.name as concept_name,
          p.title as problem_title
        FROM concept_problem_mappings cpm
        JOIN concepts c ON cpm.concept_id = c.id
        JOIN problems p ON cpm.problem_id = p.id
        WHERE cpm.concept_id IN (${placeholders})
      `).all(...conceptIds);
    }

    // Get concept prerequisites (for visualization)
    let prerequisites = [];
    if (conceptIds.length > 0) {
      const placeholders = conceptIds.map(() => '?').join(',');
      prerequisites = db.prepare(`
        SELECT
          cp.concept_id,
          cp.prerequisite_id,
          cp.importance,
          c1.name as concept_name,
          c2.name as prerequisite_name
        FROM concept_prerequisites cp
        JOIN concepts c1 ON cp.concept_id = c1.id
        JOIN concepts c2 ON cp.prerequisite_id = c2.id
        WHERE cp.concept_id IN (${placeholders})
      `).all(...conceptIds);
    }

    // If student_id is provided, enrich with student progress
    if (student_id) {
      const progressMap = new Map();
      const progress = db.prepare(`
        SELECT problem_id, concept_id, status, best_score
        FROM student_progress
        WHERE student_id = ?
      `).all(student_id);

      progress.forEach(p => {
        progressMap.set(`${p.concept_id}-${p.problem_id}`, p);
      });

      // Add progress info to mappings
      mappings = mappings.map(m => ({
        ...m,
        student_progress: progressMap.get(`${m.concept_id}-${m.problem_id}`) || null
      }));
    }

    res.json({
      success: true,
      data: {
        nodes: {
          concepts,
          problems
        },
        edges: {
          mappings,
          prerequisites
        },
        statistics: {
          total_concepts: concepts.length,
          total_problems: problems.length,
          total_mappings: mappings.length,
          total_prerequisites: prerequisites.length
        }
      },
      filters: {
        category,
        difficulty_level,
        concept_id,
        student_id
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET learning path (concept progression)
router.get('/learning-path/:studentId', (req, res) => {
  try {
    const { studentId } = req.params;

    // Get student's mastered concepts
    const mastered = db.prepare(`
      SELECT DISTINCT concept_id
      FROM student_progress
      WHERE student_id = ? AND status = 'mastered'
    `).all(studentId).map(row => row.concept_id);

    // Get recommended next concepts based on prerequisites
    let nextConcepts = [];
    if (mastered.length > 0) {
      const placeholders = mastered.map(() => '?').join(',');
      nextConcepts = db.prepare(`
        SELECT c.*,
          COUNT(cp.prerequisite_id) as total_prereqs,
          SUM(CASE WHEN cp.prerequisite_id IN (${placeholders}) THEN 1 ELSE 0 END) as met_prereqs
        FROM concepts c
        LEFT JOIN concept_prerequisites cp ON c.id = cp.concept_id
        WHERE c.id NOT IN (
          SELECT concept_id FROM student_progress
          WHERE student_id = ? AND status IN ('completed', 'mastered')
        )
        GROUP BY c.id
        HAVING met_prereqs = total_prereqs OR total_prereqs = 0
        ORDER BY c.difficulty_level ASC, met_prereqs DESC
        LIMIT 10
      `).all(...mastered, studentId);
    } else {
      // No mastered concepts yet - show beginner concepts
      nextConcepts = db.prepare(`
        SELECT * FROM concepts
        WHERE difficulty_level = 'beginner'
        AND id NOT IN (
          SELECT concept_id FROM student_progress
          WHERE student_id = ? AND status IN ('completed', 'mastered')
        )
        ORDER BY name
        LIMIT 10
      `).all(studentId);
    }

    res.json({
      success: true,
      data: {
        mastered_concepts: mastered,
        recommended_concepts: nextConcepts
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
