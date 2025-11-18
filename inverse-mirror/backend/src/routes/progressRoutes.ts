import { Router, Request, Response } from 'express';
import progressService from '../services/progressService.js';

const router = Router();

/**
 * POST /api/progress
 * Save student progress
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const progress = req.body;

    // Validate required fields
    if (!progress.studentId || !progress.problemId) {
      return res.status(400).json({ error: 'Missing required fields: studentId, problemId' });
    }

    const id = await progressService.saveProgress(progress);
    res.status(201).json({
      id,
      message: 'Progress saved successfully',
    });
  } catch (error) {
    console.error('Error saving progress:', error);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

/**
 * GET /api/progress/:studentId
 * Get all progress for a student
 */
router.get('/:studentId', async (req: Request, res: Response) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const progress = await progressService.getProgressByStudent(studentId);
    res.json(progress);
  } catch (error) {
    console.error('Error getting progress:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

/**
 * GET /api/progress/:studentId/:problemId
 * Get progress for specific problem
 */
router.get('/:studentId/:problemId', async (req: Request, res: Response) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const problemId = parseInt(req.params.problemId);

    const progress = await progressService.getProgressByProblem(studentId, problemId);

    if (!progress) {
      return res.status(404).json({ error: 'Progress not found' });
    }

    res.json(progress);
  } catch (error) {
    console.error('Error getting progress:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

/**
 * GET /api/progress/:studentId/stats
 * Get statistics for a student
 */
router.get('/:studentId/stats', async (req: Request, res: Response) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const stats = await progressService.getStudentStats(studentId);
    res.json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

export default router;
