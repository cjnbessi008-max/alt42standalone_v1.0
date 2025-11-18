import express from 'express';
import {
  getAllProblems,
  getProblemById,
  createProblem,
  updateProblem,
  deleteProblem,
  getRandomProblem
} from '../controllers/problemController.js';

const router = express.Router();

// GET /api/problems - Get all problems
router.get('/', getAllProblems);

// GET /api/problems/random - Get a random problem
router.get('/random', getRandomProblem);

// GET /api/problems/:id - Get specific problem
router.get('/:id', getProblemById);

// POST /api/problems - Create new problem (from Moodle or manually)
router.post('/', createProblem);

// PUT /api/problems/:id - Update problem
router.put('/:id', updateProblem);

// DELETE /api/problems/:id - Delete problem
router.delete('/:id', deleteProblem);

export default router;
