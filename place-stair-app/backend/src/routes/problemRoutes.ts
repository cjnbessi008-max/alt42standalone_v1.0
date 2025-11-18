import { Router, Request, Response } from 'express';
import problemGenerator from '../services/problemGenerator';
import moodleService from '../services/moodleService';
import { StudentAnswer } from '../types';

const router = Router();

/**
 * GET /api/problems/generate
 * Generate new problems based on configuration
 */
router.get('/generate', (req: Request, res: Response) => {
  try {
    const {
      minValue = 1,
      maxValue = 999,
      difficulty = 1,
      count = 5
    } = req.query;

    const problems = problemGenerator.generateProblems({
      minValue: Number(minValue),
      maxValue: Number(maxValue),
      difficulty: Number(difficulty),
      count: Number(count)
    });

    res.json({
      success: true,
      data: problems
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/problems/moodle/:studentId/:courseId
 * Fetch problems from Moodle for a specific student
 */
router.get('/moodle/:studentId/:courseId', async (req: Request, res: Response) => {
  try {
    const { studentId, courseId } = req.params;
    const result = await moodleService.getProblemsForStudent(
      Number(studentId),
      Number(courseId)
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/problems/validate
 * Validate a student's answer
 */
router.post('/validate', (req: Request, res: Response) => {
  try {
    const { problem, answer } = req.body;

    if (!problem || !answer) {
      return res.status(400).json({
        success: false,
        error: 'Problem and answer are required'
      });
    }

    const validation = problemGenerator.validateAnswer(problem, answer);

    res.json({
      success: true,
      data: validation
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/problems/submit
 * Submit answer to Moodle
 */
router.post('/submit', async (req: Request, res: Response) => {
  try {
    const { studentId, problemId, answer, isCorrect, timeSpent }: StudentAnswer & { isCorrect: boolean } = req.body;

    if (!studentId || !problemId || !answer) {
      return res.status(400).json({
        success: false,
        error: 'Student ID, problem ID, and answer are required'
      });
    }

    const result = await moodleService.submitAnswer(
      studentId,
      problemId,
      answer,
      isCorrect,
      timeSpent
    );

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/problems/progress/:studentId/:courseId
 * Get student progress from Moodle
 */
router.get('/progress/:studentId/:courseId', async (req: Request, res: Response) => {
  try {
    const { studentId, courseId } = req.params;
    const result = await moodleService.getStudentProgress(
      Number(studentId),
      Number(courseId)
    );

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
