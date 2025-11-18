import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { ProblemModel } from '../models/Problem';

const router = Router();

/**
 * GET /api/problems
 * Get all problems
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const problems = await ProblemModel.getAll();
    res.json({ success: true, data: problems });
  } catch (error) {
    console.error('Error fetching problems:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch problems' });
  }
});

/**
 * GET /api/problems/:id
 * Get problem by ID
 */
router.get(
  '/:id',
  param('id').isInt({ min: 1 }),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const problem = await ProblemModel.getById(parseInt(req.params.id));
      if (!problem) {
        return res.status(404).json({ success: false, error: 'Problem not found' });
      }
      res.json({ success: true, data: problem });
    } catch (error) {
      console.error('Error fetching problem:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch problem' });
    }
  }
);

/**
 * POST /api/problems
 * Create new problem
 */
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('inequality').trim().notEmpty().withMessage('Inequality is required'),
    body('difficulty_level').isInt({ min: 1, max: 5 }).withMessage('Difficulty level must be 1-5'),
    body('moodle_id').optional().trim(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { title, description, inequality, moodle_id, difficulty_level } = req.body;
      const problemId = await ProblemModel.create({
        title,
        description,
        inequality,
        moodle_id,
        difficulty_level,
      });

      const problem = await ProblemModel.getById(problemId);
      res.status(201).json({ success: true, data: problem });
    } catch (error) {
      console.error('Error creating problem:', error);
      res.status(500).json({ success: false, error: 'Failed to create problem' });
    }
  }
);

/**
 * PUT /api/problems/:id
 * Update problem
 */
router.put(
  '/:id',
  [
    param('id').isInt({ min: 1 }),
    body('title').optional().trim().notEmpty(),
    body('description').optional().trim().notEmpty(),
    body('inequality').optional().trim().notEmpty(),
    body('difficulty_level').optional().isInt({ min: 1, max: 5 }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const id = parseInt(req.params.id);
      const updated = await ProblemModel.update(id, req.body);

      if (!updated) {
        return res.status(404).json({ success: false, error: 'Problem not found' });
      }

      const problem = await ProblemModel.getById(id);
      res.json({ success: true, data: problem });
    } catch (error) {
      console.error('Error updating problem:', error);
      res.status(500).json({ success: false, error: 'Failed to update problem' });
    }
  }
);

/**
 * DELETE /api/problems/:id
 * Delete problem
 */
router.delete(
  '/:id',
  param('id').isInt({ min: 1 }),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const deleted = await ProblemModel.delete(parseInt(req.params.id));

      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Problem not found' });
      }

      res.json({ success: true, message: 'Problem deleted successfully' });
    } catch (error) {
      console.error('Error deleting problem:', error);
      res.status(500).json({ success: false, error: 'Failed to delete problem' });
    }
  }
);

export default router;
