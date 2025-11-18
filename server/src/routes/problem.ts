import { Router, Request, Response, NextFunction } from 'express';
import { ProblemService } from '../services/problemService';
import { createError } from '../middleware/errorHandler';

const router = Router();
const problemService = new ProblemService();

/**
 * POST /api/problems
 * Create a new problem from Moodle question data
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { moodleQuestionId, title, description, problemData } = req.body;

    if (!problemData) {
      throw createError('Problem data is required', 400);
    }

    const problem = await problemService.createProblem({
      moodleQuestionId,
      title,
      description,
      problemData
    });

    res.status(201).json({
      success: true,
      data: problem
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/problems/:id
 * Get problem by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const problem = await problemService.getProblemById(id);

    if (!problem) {
      throw createError('Problem not found', 404);
    }

    res.json({
      success: true,
      data: problem
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/problems/moodle/:moodleQuestionId
 * Get problem by Moodle question ID
 */
router.get('/moodle/:moodleQuestionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { moodleQuestionId } = req.params;
    const problem = await problemService.getProblemByMoodleId(parseInt(moodleQuestionId));

    if (!problem) {
      throw createError('Problem not found', 404);
    }

    res.json({
      success: true,
      data: problem
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/problems/:id
 * Update problem
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const problem = await problemService.updateProblem(id, updates);

    res.json({
      success: true,
      data: problem
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/problems/:id
 * Delete problem
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await problemService.deleteProblem(id);

    res.json({
      success: true,
      message: 'Problem deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
