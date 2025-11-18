import { Router, Request, Response } from 'express';
import problemService from '../services/problemService.js';

const router = Router();

/**
 * GET /api/problems/random
 * Get a random problem
 */
router.get('/random', async (req: Request, res: Response) => {
  try {
    const problem = await problemService.getRandomProblem();
    res.json(problem);
  } catch (error) {
    console.error('Error getting random problem:', error);
    res.status(500).json({ error: 'Failed to get problem' });
  }
});

/**
 * GET /api/problems/:id
 * Get a specific problem by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const problem = await problemService.getProblemById(id);

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    res.json(problem);
  } catch (error) {
    console.error('Error getting problem:', error);
    res.status(500).json({ error: 'Failed to get problem' });
  }
});

/**
 * GET /api/problems
 * Get all problems
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const problems = await problemService.getAllProblems();
    res.json(problems);
  } catch (error) {
    console.error('Error getting problems:', error);
    res.status(500).json({ error: 'Failed to get problems' });
  }
});

/**
 * POST /api/problems
 * Create a new problem
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const problem = req.body;
    const id = await problemService.saveProblem(problem);
    res.status(201).json({ id, message: 'Problem created successfully' });
  } catch (error) {
    console.error('Error creating problem:', error);
    res.status(500).json({ error: 'Failed to create problem' });
  }
});

/**
 * GET /api/problems/moodle/:quizId
 * Get problem from Moodle quiz
 */
router.get('/moodle/:quizId', async (req: Request, res: Response) => {
  try {
    const quizId = parseInt(req.params.quizId);
    const problem = await problemService.getProblemFromMoodle(quizId);

    if (!problem) {
      return res.status(404).json({ error: 'No problems found in Moodle quiz' });
    }

    res.json(problem);
  } catch (error) {
    console.error('Error getting Moodle problem:', error);
    res.status(500).json({ error: 'Failed to get problem from Moodle' });
  }
});

export default router;
