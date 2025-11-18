/**
 * Problem Routes
 * API endpoints for problem management
 */

import express from 'express';
import { generateMockProblems, getProblemById } from '../utils/mockData.js';

const router = express.Router();

/**
 * GET /api/modules/:moduleId/problems
 * Fetch all problems for a module
 */
router.get('/:moduleId/problems', (req, res) => {
  try {
    const { moduleId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    // Generate mock problems for demo
    const problems = generateMockProblems(moduleId, limit);

    res.json({
      success: true,
      moduleId,
      count: problems.length,
      problems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/modules/:moduleId/problems/:problemId
 * Fetch a specific problem
 */
router.get('/:moduleId/problems/:problemId', (req, res) => {
  try {
    const { moduleId, problemId } = req.params;

    const problem = getProblemById(problemId);

    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }

    res.json({
      success: true,
      problem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/modules/:moduleId/submit
 * Submit an answer to a problem
 */
router.post('/:moduleId/submit', (req, res) => {
  try {
    const { moduleId } = req.params;
    const { problemId, answer } = req.body;

    // Mock validation logic
    const isCorrect = Math.random() > 0.5; // Random for demo

    res.json({
      success: true,
      correct: isCorrect,
      feedback: isCorrect
        ? 'Correct! Great job!'
        : 'Incorrect. Please try again.',
      moduleId,
      problemId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/modules/:moduleId/status
 * Get module status
 */
router.get('/:moduleId/status', (req, res) => {
  const { moduleId } = req.params;

  res.json({
    success: true,
    moduleId,
    status: 'active',
    totalProblems: 100,
    timestamp: new Date().toISOString()
  });
});

export default router;
