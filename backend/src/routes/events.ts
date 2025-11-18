import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { query } from '../config/database';
import { logger } from '../utils/logger';
import { io } from '../index';

const router = express.Router();

/**
 * POST /api/events
 * Record a learning event
 */
router.post(
  '/',
  [
    body('session_id').isUUID().withMessage('Valid session_id is required'),
    body('student_id').isUUID().withMessage('Valid student_id is required'),
    body('event_type').isString().notEmpty().withMessage('event_type is required'),
    body('event_action').optional().isString(),
    body('event_target').optional().isString(),
    body('event_data').optional().isObject(),
    body('problem_id').optional().isUUID(),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400);
    }

    const {
      session_id,
      student_id,
      problem_id,
      event_type,
      event_action,
      event_target,
      event_data,
    } = req.body;

    // Get the next sequence number for this session
    const [sequenceResult] = await query<{ max_seq: number }>(
      'SELECT COALESCE(MAX(sequence_number), 0) as max_seq FROM learning_events WHERE session_id = ?',
      [session_id]
    );
    const sequence_number = (sequenceResult?.max_seq || 0) + 1;

    // Insert the event
    await query(
      `INSERT INTO learning_events
       (session_id, student_id, problem_id, event_type, event_action, event_target, event_data, sequence_number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session_id,
        student_id,
        problem_id || null,
        event_type,
        event_action || null,
        event_target || null,
        event_data ? JSON.stringify(event_data) : null,
        sequence_number,
      ]
    );

    // Emit event via WebSocket for real-time monitoring
    io.to(`session:${session_id}`).emit('learning_event', {
      session_id,
      student_id,
      event_type,
      sequence_number,
      timestamp: new Date(),
    });

    logger.info(`Event recorded: ${event_type} for session ${session_id}`);

    res.status(201).json({
      status: 'success',
      message: 'Event recorded successfully',
      data: { sequence_number },
    });
  })
);

/**
 * POST /api/events/batch
 * Record multiple events at once (for offline sync)
 */
router.post(
  '/batch',
  [
    body('events').isArray().withMessage('events must be an array'),
    body('events.*.session_id').isUUID(),
    body('events.*.student_id').isUUID(),
    body('events.*.event_type').isString().notEmpty(),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400);
    }

    const { events } = req.body;

    // Prepare bulk insert
    const values = events.map((event: any) => [
      event.session_id,
      event.student_id,
      event.problem_id || null,
      event.event_type,
      event.event_action || null,
      event.event_target || null,
      event.event_data ? JSON.stringify(event.event_data) : null,
      event.timestamp || new Date(),
    ]);

    await query(
      `INSERT INTO learning_events
       (session_id, student_id, problem_id, event_type, event_action, event_target, event_data, timestamp)
       VALUES ?`,
      [values]
    );

    logger.info(`Batch inserted ${events.length} events`);

    res.status(201).json({
      status: 'success',
      message: `${events.length} events recorded successfully`,
    });
  })
);

/**
 * GET /api/events/session/:sessionId
 * Get all events for a specific session
 */
router.get(
  '/session/:sessionId',
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;

    const events = await query(
      `SELECT * FROM learning_events
       WHERE session_id = ?
       ORDER BY timestamp ASC, sequence_number ASC`,
      [sessionId]
    );

    res.json({
      status: 'success',
      data: { events },
    });
  })
);

/**
 * GET /api/events/student/:studentId
 * Get recent events for a student
 */
router.get(
  '/student/:studentId',
  asyncHandler(async (req: Request, res: Response) => {
    const { studentId } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;

    const events = await query(
      `SELECT * FROM learning_events
       WHERE student_id = ?
       ORDER BY timestamp DESC
       LIMIT ?`,
      [studentId, limit]
    );

    res.json({
      status: 'success',
      data: { events },
    });
  })
);

export default router;
