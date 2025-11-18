import { Router, Request, Response } from 'express';
import { ProgressModel } from '../models/Progress';
import { ProblemModel } from '../models/Problem';
import { ApiResponse, EquationStep } from '../types';

const router = Router();

// GET /api/progress/:studentId - Get all progress for a student
router.get('/:studentId', async (req: Request, res: Response) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const progress = await ProgressModel.getByStudentId(studentId);

    const response: ApiResponse<typeof progress> = {
      success: true,
      data: progress,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching progress:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch progress',
    };
    res.status(500).json(response);
  }
});

// GET /api/progress/:studentId/stats - Get statistics for a student
router.get('/:studentId/stats', async (req: Request, res: Response) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const stats = await ProgressModel.getStats(studentId);

    const response: ApiResponse<typeof stats> = {
      success: true,
      data: stats,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching stats:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch statistics',
    };
    res.status(500).json(response);
  }
});

// GET /api/progress/:studentId/:problemId - Get specific problem progress
router.get('/:studentId/:problemId', async (req: Request, res: Response) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const problemId = parseInt(req.params.problemId);

    const progress = await ProgressModel.getByStudentAndProblem(studentId, problemId);

    if (!progress) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Progress not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<typeof progress> = {
      success: true,
      data: progress,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching progress:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch progress',
    };
    res.status(500).json(response);
  }
});

// POST /api/progress - Start a new problem
router.post('/', async (req: Request, res: Response) => {
  try {
    const { student_id, problem_id } = req.body;

    if (!student_id || !problem_id) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Missing student_id or problem_id',
      };
      return res.status(400).json(response);
    }

    // Check if problem exists
    const problem = await ProblemModel.getById(problem_id);
    if (!problem) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Problem not found',
      };
      return res.status(404).json(response);
    }

    // Check if progress already exists
    const existingProgress = await ProgressModel.getByStudentAndProblem(
      student_id,
      problem_id
    );

    if (existingProgress) {
      const response: ApiResponse<typeof existingProgress> = {
        success: true,
        data: existingProgress,
        message: 'Progress already exists',
      };
      return res.json(response);
    }

    // Create new progress
    const progressId = await ProgressModel.create({ student_id, problem_id });

    const response: ApiResponse<{ id: number }> = {
      success: true,
      data: { id: progressId },
      message: 'Progress started successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating progress:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to start progress',
    };
    res.status(500).json(response);
  }
});

// POST /api/progress/submit - Submit an attempt
router.post('/submit', async (req: Request, res: Response) => {
  try {
    const {
      student_id,
      problem_id,
      steps_taken,
      student_answer,
      time_spent,
      hints_used,
    } = req.body;

    if (!student_id || !problem_id || !student_answer) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Missing required fields',
      };
      return res.status(400).json(response);
    }

    // Get problem to check answer
    const problem = await ProblemModel.getById(problem_id);
    if (!problem) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Problem not found',
      };
      return res.status(404).json(response);
    }

    // Get or create progress
    let progress = await ProgressModel.getByStudentAndProblem(student_id, problem_id);
    if (!progress) {
      const progressId = await ProgressModel.create({ student_id, problem_id });
      progress = await ProgressModel.getByStudentAndProblem(student_id, problem_id);
    }

    if (!progress) {
      throw new Error('Failed to create or retrieve progress');
    }

    // Check if answer is correct
    const isCorrect = student_answer.trim().toLowerCase() === problem.solution.trim().toLowerCase();

    // Calculate score (100 - penalties)
    const hintPenalty = (hints_used || 0) * 5;
    const attemptPenalty = progress.attempts_count * 10;
    let score = isCorrect ? Math.max(0, 100 - hintPenalty - attemptPenalty) : 0;

    // Record the attempt
    const attemptId = await ProgressModel.recordAttempt({
      progress_id: progress.id,
      student_id,
      problem_id,
      attempt_number: progress.attempts_count + 1,
      steps_taken: steps_taken || [],
      student_answer,
      is_correct: isCorrect,
      score,
      time_spent: time_spent || 0,
      hints_used_in_attempt: hints_used || 0,
    });

    // Update progress
    const updates: any = {
      attempts_count: progress.attempts_count + 1,
      hints_used: progress.hints_used + (hints_used || 0),
      time_spent: progress.time_spent + (time_spent || 0),
    };

    if (isCorrect) {
      updates.status = 'completed';
      updates.is_correct = true;
      updates.final_score = Math.max(progress.final_score, score);
      updates.completed_at = new Date();
    } else if (progress.attempts_count + 1 >= 5) {
      updates.status = 'failed';
    }

    await ProgressModel.update(student_id, problem_id, updates);

    const response: ApiResponse<{
      is_correct: boolean;
      score: number;
      attempt_id: number;
    }> = {
      success: true,
      data: {
        is_correct: isCorrect,
        score,
        attempt_id: attemptId,
      },
      message: isCorrect ? 'Correct answer!' : 'Incorrect answer. Try again!',
    };

    res.json(response);
  } catch (error) {
    console.error('Error submitting attempt:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to submit attempt',
    };
    res.status(500).json(response);
  }
});

// GET /api/progress/:studentId/:problemId/attempts - Get all attempts for a problem
router.get('/:studentId/:problemId/attempts', async (req: Request, res: Response) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const problemId = parseInt(req.params.problemId);

    const attempts = await ProgressModel.getAttempts(studentId, problemId);

    const response: ApiResponse<typeof attempts> = {
      success: true,
      data: attempts,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching attempts:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch attempts',
    };
    res.status(500).json(response);
  }
});

export default router;
