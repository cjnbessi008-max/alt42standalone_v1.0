import { Router, Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { createError } from '../middleware/errorHandler';
import { ApiResponse, StudentAttempt } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

/**
 * POST /api/progress/attempt
 * Save student attempt
 */
router.post('/attempt', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      problemId,
      moodleUserId,
      studentName,
      answer,
      isCorrect,
      timeSpentSeconds,
      treeInteractionLog
    } = req.body;

    if (!problemId || !moodleUserId || !answer) {
      throw createError('Missing required fields', 400);
    }

    // Get attempt number
    const [attempts] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM student_attempts WHERE problem_id = ? AND moodle_user_id = ?',
      [problemId, moodleUserId]
    );
    const attemptNumber = (attempts[0]?.count || 0) + 1;

    // Insert attempt
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO student_attempts
       (problem_id, moodle_user_id, student_name, answer, is_correct,
        time_spent_seconds, tree_interaction_log, attempt_number, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        problemId,
        moodleUserId,
        studentName || null,
        JSON.stringify(answer),
        isCorrect,
        timeSpentSeconds || null,
        treeInteractionLog ? JSON.stringify(treeInteractionLog) : null,
        attemptNumber
      ]
    );

    // Update progress
    await pool.query(
      `INSERT INTO student_progress
       (moodle_user_id, problem_id, total_attempts, correct_attempts, last_attempt_at)
       VALUES (?, ?, 1, ?, NOW())
       ON DUPLICATE KEY UPDATE
         total_attempts = total_attempts + 1,
         correct_attempts = correct_attempts + ?,
         last_attempt_at = NOW()`,
      [moodleUserId, problemId, isCorrect ? 1 : 0, isCorrect ? 1 : 0]
    );

    // Calculate mastery level
    const [progress] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM student_progress WHERE moodle_user_id = ? AND problem_id = ?',
      [moodleUserId, problemId]
    );

    if (progress.length > 0) {
      const masteryLevel = (progress[0].correct_attempts / progress[0].total_attempts) * 100;
      await pool.query(
        'UPDATE student_progress SET mastery_level = ? WHERE moodle_user_id = ? AND problem_id = ?',
        [masteryLevel, moodleUserId, problemId]
      );
    }

    const response: ApiResponse = {
      success: true,
      data: {
        attemptId: result.insertId,
        attemptNumber,
        isCorrect
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/progress/student/:userId/problem/:problemId
 * Get student progress for a problem
 */
router.get('/student/:userId/problem/:problemId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.params.userId);
    const problemId = parseInt(req.params.problemId);

    if (isNaN(userId) || isNaN(problemId)) {
      throw createError('Invalid user ID or problem ID', 400);
    }

    const [progress] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM student_progress WHERE moodle_user_id = ? AND problem_id = ?',
      [userId, problemId]
    );

    const [attempts] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM student_attempts WHERE moodle_user_id = ? AND problem_id = ? ORDER BY started_at DESC',
      [userId, problemId]
    );

    const response: ApiResponse = {
      success: true,
      data: {
        progress: progress[0] || null,
        attempts: attempts.map(a => ({
          ...a,
          answer: typeof a.answer === 'string' ? JSON.parse(a.answer) : a.answer,
          tree_interaction_log: a.tree_interaction_log && typeof a.tree_interaction_log === 'string'
            ? JSON.parse(a.tree_interaction_log)
            : a.tree_interaction_log
        }))
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/progress/student/:userId
 * Get all progress for a student
 */
router.get('/student/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      throw createError('Invalid user ID', 400);
    }

    const [progress] = await pool.query<RowDataPacket[]>(
      `SELECT sp.*, p.title, p.problem_type
       FROM student_progress sp
       JOIN problems p ON sp.problem_id = p.id
       WHERE sp.moodle_user_id = ?
       ORDER BY sp.updated_at DESC`,
      [userId]
    );

    const response: ApiResponse = {
      success: true,
      data: progress,
      meta: {
        timestamp: new Date().toISOString(),
        count: progress.length
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
