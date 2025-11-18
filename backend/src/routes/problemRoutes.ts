import { Router } from 'express';
import {
  getRandomProblem,
  getProblemById,
  getAllProblems,
  createProblem,
} from '../controllers/problemController';

const router = Router();

router.get('/random', getRandomProblem);
router.get('/:id', getProblemById);
router.get('/', getAllProblems);
router.post('/', createProblem);

export default router;
