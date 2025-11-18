import { Response } from 'express';
import { query, queryOne } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

/**
 * Submit an attempt
 */
export const submitAttempt = async (req: AuthRequest, res: Response) => {
  const { problemId } = req.params;
  const {
    student_answer,
    student_shape_data,
    calculated_area,
    calculated_overlap,
    overlap_ratio,
    time_spent,
  } = req.body;

  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  // Get problem to check answer
  const problem: any = await queryOne(
    'SELECT * FROM problems WHERE id = ? AND is_active = 1',
    [problemId]
  );

  if (!problem) {
    throw new AppError('Problem not found', 404);
  }

  // Check max attempts
  if (problem.max_attempts) {
    const attemptCount: any = await queryOne(
      'SELECT COUNT(*) as count FROM attempts WHERE problem_id = ? AND user_id = ?',
      [problemId, req.user.id]
    );

    if (attemptCount.count >= problem.max_attempts) {
      throw new AppError('Maximum attempts reached', 403);
    }
  }

  // Calculate if correct and score
  let isCorrect = false;
  let score = 0;

  if (problem.correct_answer) {
    const correctAnswer = JSON.parse(problem.correct_answer);

    // Simple comparison (can be made more sophisticated)
    if (correctAnswer.overlap_ratio) {
      const diff = Math.abs(overlap_ratio - correctAnswer.overlap_ratio);
      if (diff < 5) { // Within 5% tolerance
        isCorrect = true;
        score = Math.max(0, 100 - diff * 10);
      } else {
        score = Math.max(0, 100 - diff * 5);
      }
    }
  }

  // Get attempt number
  const attemptNumber: any = await queryOne(
    'SELECT COALESCE(MAX(attempt_number), 0) + 1 as next_num FROM attempts WHERE problem_id = ? AND user_id = ?',
    [problemId, req.user.id]
  );

  // Insert attempt
  const result: any = await query(
    `INSERT INTO attempts (
      problem_id,
      user_id,
      student_answer,
      student_shape_data,
      calculated_area,
      calculated_overlap,
      overlap_ratio,
      is_correct,
      score,
      time_spent,
      attempt_number,
      submitted_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      problemId,
      req.user.id,
      JSON.stringify(student_answer),
      JSON.stringify(student_shape_data),
      calculated_area,
      calculated_overlap,
      overlap_ratio,
      isCorrect ? 1 : 0,
      score,
      time_spent,
      attemptNumber.next_num,
    ]
  );

  res.status(201).json({
    message: 'Attempt submitted successfully',
    attemptId: result.insertId,
    isCorrect,
    score,
    attemptNumber: attemptNumber.next_num,
  });
};

/**
 * Get user's attempts for a problem
 */
export const getAttempts = async (req: AuthRequest, res: Response) => {
  const { problemId } = req.params;

  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const attempts = await query(
    `SELECT
      id,
      attempt_number,
      calculated_area,
      calculated_overlap,
      overlap_ratio,
      is_correct,
      score,
      time_spent,
      submitted_at
    FROM attempts
    WHERE problem_id = ? AND user_id = ?
    ORDER BY attempt_number DESC`,
    [problemId, req.user.id]
  );

  res.json({ attempts });
};

/**
 * Get single attempt details
 */
export const getAttempt = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const attempt = await queryOne(
    'SELECT * FROM attempts WHERE id = ? AND user_id = ?',
    [id, req.user.id]
  );

  if (!attempt) {
    throw new AppError('Attempt not found', 404);
  }

  res.json(attempt);
};

/**
 * Get all attempts for current user
 */
export const getMyAttempts = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { limit = 20, offset = 0 } = req.query;

  const attempts = await query(
    `SELECT
      a.*,
      p.title as problem_title,
      p.difficulty
    FROM attempts a
    JOIN problems p ON a.problem_id = p.id
    WHERE a.user_id = ?
    ORDER BY a.submitted_at DESC
    LIMIT ? OFFSET ?`,
    [req.user.id, Number(limit), Number(offset)]
  );

  res.json({ attempts });
};
