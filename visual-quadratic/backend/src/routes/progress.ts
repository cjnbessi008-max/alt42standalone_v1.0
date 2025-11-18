import { Router } from 'express';
import { query } from '../config/database.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const submitAttemptSchema = z.object({
  student_id: z.string().uuid(),
  problem_id: z.string().uuid(),
  submitted_a: z.number(),
  submitted_b: z.number(),
  submitted_c: z.number(),
  time_taken_seconds: z.number().int().min(0),
});

// Calculate accuracy score (0-100)
function calculateAccuracy(
  target: { a: number; b: number; c: number },
  submitted: { a: number; b: number; c: number }
): number {
  const aDiff = Math.abs(target.a - submitted.a);
  const bDiff = Math.abs(target.b - submitted.b);
  const cDiff = Math.abs(target.c - submitted.c);

  const maxDiff = 10; // Maximum acceptable difference
  const totalDiff = aDiff + bDiff + cDiff;
  const accuracy = Math.max(0, 100 - (totalDiff / (maxDiff * 3)) * 100);

  return Math.round(accuracy * 100) / 100;
}

// GET /api/progress/student/:studentId - Get student's overall progress
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    const result = await query(
      `SELECT p.*, pr.title as problem_title, pr.difficulty
       FROM student_progress p
       JOIN problems pr ON p.problem_id = pr.id
       WHERE p.student_id = $1
       ORDER BY p.last_attempt_at DESC`,
      [studentId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching student progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// GET /api/progress/problem/:problemId/student/:studentId - Get specific progress
router.get('/problem/:problemId/student/:studentId', async (req, res) => {
  try {
    const { problemId, studentId } = req.params;

    const result = await query(
      'SELECT * FROM student_progress WHERE problem_id = $1 AND student_id = $2',
      [problemId, studentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Progress not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// POST /api/progress/submit - Submit an attempt
router.post('/submit', async (req, res) => {
  try {
    const data = submitAttemptSchema.parse(req.body);

    // Get problem target values
    const problemResult = await query(
      'SELECT target_a, target_b, target_c FROM problems WHERE id = $1',
      [data.problem_id]
    );

    if (problemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const target = problemResult.rows[0];
    const accuracy = calculateAccuracy(
      { a: target.target_a, b: target.target_b, c: target.target_c },
      { a: data.submitted_a, b: data.submitted_b, c: data.submitted_c }
    );

    const isCompleted = accuracy >= 95; // 95% or higher is considered complete

    // Check if progress record exists
    const progressResult = await query(
      'SELECT * FROM student_progress WHERE student_id = $1 AND problem_id = $2',
      [data.student_id, data.problem_id]
    );

    let progressId: string;

    if (progressResult.rows.length === 0) {
      // Create new progress record
      const newProgress = await query(
        `INSERT INTO student_progress (student_id, problem_id, attempts, completed, time_spent_seconds, best_score)
         VALUES ($1, $2, 1, $3, $4, $5)
         RETURNING id`,
        [data.student_id, data.problem_id, isCompleted, data.time_taken_seconds, accuracy]
      );
      progressId = newProgress.rows[0].id;
    } else {
      // Update existing progress
      const existing = progressResult.rows[0];
      progressId = existing.id;

      await query(
        `UPDATE student_progress
         SET attempts = attempts + 1,
             completed = $1,
             time_spent_seconds = time_spent_seconds + $2,
             best_score = GREATEST(best_score, $3),
             last_attempt_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [isCompleted || existing.completed, data.time_taken_seconds, accuracy, progressId]
      );
    }

    // Record the attempt
    const attemptResult = await query(
      `INSERT INTO attempts (progress_id, submitted_a, submitted_b, submitted_c, accuracy_score, time_taken_seconds)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        progressId,
        data.submitted_a,
        data.submitted_b,
        data.submitted_c,
        accuracy,
        data.time_taken_seconds,
      ]
    );

    res.status(201).json({
      attempt: attemptResult.rows[0],
      accuracy,
      completed: isCompleted,
      message: isCompleted ? '완료! 정답입니다!' : `정확도: ${accuracy}% - 다시 시도해보세요!`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error submitting attempt:', error);
    res.status(500).json({ error: 'Failed to submit attempt' });
  }
});

// GET /api/progress/problem/:problemId/leaderboard - Get problem leaderboard
router.get('/problem/:problemId/leaderboard', async (req, res) => {
  try {
    const { problemId } = req.params;

    const result = await query(
      `SELECT
         s.name,
         p.best_score,
         p.attempts,
         p.time_spent_seconds,
         p.last_attempt_at
       FROM student_progress p
       JOIN students s ON p.student_id = s.id
       WHERE p.problem_id = $1 AND p.completed = true
       ORDER BY p.best_score DESC, p.time_spent_seconds ASC
       LIMIT 10`,
      [problemId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

export default router;
