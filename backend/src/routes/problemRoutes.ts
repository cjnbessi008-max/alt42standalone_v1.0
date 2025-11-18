import { Router } from 'express';
import {
  getAllProblems,
  getProblemById,
  getProblemStatistics,
  createProblem,
} from '../controllers/problemController';

const router = Router();

/**
 * @route   GET /api/problems
 * @desc    Get all problems
 * @access  Public
 */
router.get('/', getAllProblems);

/**
 * @route   GET /api/problems/:id
 * @desc    Get problem by ID with correspondence pairs
 * @query   randomize - Randomize item order (true/false)
 * @access  Public
 */
router.get('/:id', getProblemById);

/**
 * @route   GET /api/problems/:id/statistics
 * @desc    Get problem statistics
 * @access  Public
 */
router.get('/:id/statistics', getProblemStatistics);

/**
 * @route   POST /api/problems
 * @desc    Create new problem
 * @access  Teacher only (would require authentication in production)
 */
router.post('/', createProblem);

export default router;
