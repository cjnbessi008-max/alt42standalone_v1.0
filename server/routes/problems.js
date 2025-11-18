import express from 'express';
import {
  getAllProblems,
  getProblemById,
  createProblem,
  updateProblem,
  deleteProblem,
  getProblemPairs
} from '../controllers/problemsController.js';

const router = express.Router();

// GET all problems
router.get('/', getAllProblems);

// GET problem by ID
router.get('/:id', getProblemById);

// GET problem pairs (3D-2D matching pairs)
router.get('/:id/pairs', getProblemPairs);

// POST create new problem
router.post('/', createProblem);

// PUT update problem
router.put('/:id', updateProblem);

// DELETE problem
router.delete('/:id', deleteProblem);

export default router;
