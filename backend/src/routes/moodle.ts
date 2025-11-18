import { Router, Request, Response } from 'express';
import { param, validationResult } from 'express-validator';
import { moodleService } from '../services/moodleService';
import { ProblemModel } from '../models/Problem';

const router = Router();

/**
 * GET /api/moodle/test
 * Test Moodle connection
 */
router.get('/test', async (req: Request, res: Response) => {
  try {
    const connected = await moodleService.testConnection();
    res.json({
      success: connected,
      message: connected ? 'Moodle connected successfully' : 'Moodle connection failed',
    });
  } catch (error) {
    console.error('Moodle test failed:', error);
    res.status(500).json({ success: false, error: 'Failed to test Moodle connection' });
  }
});

/**
 * GET /api/moodle/quiz/:quizId/questions
 * Get questions from Moodle quiz
 */
router.get(
  '/quiz/:quizId/questions',
  param('quizId').notEmpty(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const questions = await moodleService.getQuizQuestions(req.params.quizId);
      res.json({ success: true, data: questions });
    } catch (error) {
      console.error('Error fetching quiz questions:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch quiz questions' });
    }
  }
);

/**
 * GET /api/moodle/question/:questionId
 * Get specific question from Moodle
 */
router.get(
  '/question/:questionId',
  param('questionId').notEmpty(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const question = await moodleService.getQuestion(req.params.questionId);
      if (!question) {
        return res.status(404).json({ success: false, error: 'Question not found' });
      }

      res.json({ success: true, data: question });
    } catch (error) {
      console.error('Error fetching question:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch question' });
    }
  }
);

/**
 * POST /api/moodle/sync/:quizId
 * Sync questions from Moodle quiz to local database
 */
router.post(
  '/sync/:quizId',
  param('quizId').notEmpty(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const quizId = req.params.quizId;
      const questions = await moodleService.syncQuizQuestions(quizId);

      const synced = [];
      for (const question of questions) {
        const inequality = moodleService.parseInequality(question);
        if (!inequality) continue;

        // Check if already exists
        const existing = await ProblemModel.getByMoodleId(question.id);
        if (existing) {
          // Update existing problem
          await ProblemModel.update(existing.id, {
            title: question.name,
            description: question.questiontext,
            inequality,
          });
          synced.push({ id: existing.id, moodleId: question.id, action: 'updated' });
        } else {
          // Create new problem
          const problemId = await ProblemModel.create({
            title: question.name,
            description: question.questiontext,
            inequality,
            moodle_id: question.id,
            difficulty_level: 3, // Default difficulty
          });
          synced.push({ id: problemId, moodleId: question.id, action: 'created' });
        }
      }

      res.json({
        success: true,
        message: `Synced ${synced.length} questions from Moodle`,
        data: synced,
      });
    } catch (error) {
      console.error('Error syncing questions:', error);
      res.status(500).json({ success: false, error: 'Failed to sync questions' });
    }
  }
);

export default router;
