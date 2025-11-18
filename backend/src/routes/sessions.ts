import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { query } from '../config/database';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * POST /api/sessions
 * Create a new learning session
 */
router.post(
  '/',
  [
    body('student_id').isUUID().withMessage('Valid student_id is required'),
    body('course_id').isUUID().withMessage('Valid course_id is required'),
    body('problem_id').optional().isUUID(),
    body('device_type').optional().isString(),
    body('browser').optional().isString(),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400);
    }

    const { student_id, course_id, problem_id, device_type, browser } = req.body;
    const sessionId = uuidv4();
    const ipAddress = req.ip || req.socket.remoteAddress;

    await query(
      `INSERT INTO learning_sessions
       (id, student_id, course_id, problem_id, device_type, browser, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [sessionId, student_id, course_id, problem_id || null, device_type, browser, ipAddress]
    );

    logger.info(`New learning session created: ${sessionId} for student ${student_id}`);

    res.status(201).json({
      status: 'success',
      data: { session_id: sessionId },
    });
  })
);

/**
 * PUT /api/sessions/:id/end
 * End a learning session
 */
router.put(
  '/:id/end',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { is_completed } = req.body;

    // Update session end time and calculate duration
    await query(
      `UPDATE learning_sessions
       SET session_end = NOW(),
           duration_sec = TIMESTAMPDIFF(SECOND, session_start, NOW()),
           is_completed = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [is_completed !== false, id]
    );

    logger.info(`Learning session ended: ${id}`);

    res.json({
      status: 'success',
      message: 'Session ended successfully',
    });
  })
);

/**
 * GET /api/sessions/:id
 * Get session details with events
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const sessions = await query(
      `SELECT ls.*, s.full_name as student_name, c.course_name, p.title as problem_title
       FROM learning_sessions ls
       JOIN students s ON ls.student_id = s.id
       JOIN courses c ON ls.course_id = c.id
       LEFT JOIN problems p ON ls.problem_id = p.id
       WHERE ls.id = ?`,
      [id]
    );

    if (sessions.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Session not found',
      });
    }

    const session = sessions[0];

    // Get event count for this session
    const eventCounts = await query(
      `SELECT event_type, COUNT(*) as count
       FROM learning_events
       WHERE session_id = ?
       GROUP BY event_type`,
      [id]
    );

    res.json({
      status: 'success',
      data: {
        session,
        event_summary: eventCounts,
      },
    });
  })
);

/**
 * GET /api/sessions/student/:studentId
 * Get all sessions for a student
 */
router.get(
  '/student/:studentId',
  asyncHandler(async (req: Request, res: Response) => {
    const { studentId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const sessions = await query(
      `SELECT ls.*, c.course_name, p.title as problem_title
       FROM learning_sessions ls
       JOIN courses c ON ls.course_id = c.id
       LEFT JOIN problems p ON ls.problem_id = p.id
       WHERE ls.student_id = ?
       ORDER BY ls.session_start DESC
       LIMIT ?`,
      [studentId, limit]
    );

    res.json({
      status: 'success',
      data: { sessions },
    });
  })
);

export default router;
