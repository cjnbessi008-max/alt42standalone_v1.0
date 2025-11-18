import { Router, Request, Response } from 'express';
import { query } from '../db/connection';
import recommendationEngine from '../services/recommendationEngine';
import { createLogger } from '../utils/logger';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const logger = createLogger();

// Validation schemas
const suggestSchema = Joi.object({
  student_id: Joi.string().required(),
  module_id: Joi.string().optional(),
  problem_id: Joi.string().optional(),
  problem_complexity: Joi.number().integer().min(1).max(5).required(),
  trigger_point: Joi.string().valid('before', 'after').required(),
  session_context: Joi.object({
    problems_attempted: Joi.number().integer().min(0).required(),
    problems_correct: Joi.number().integer().min(0).required(),
    active_time_minutes: Joi.number().min(0).required(),
    time_since_last_rest: Joi.number().min(0).optional()
  }).required()
});

const completeSchema = Joi.object({
  event_id: Joi.string().uuid().required(),
  completed: Joi.boolean().required(),
  actual_duration_seconds: Joi.number().integer().min(0).optional(),
  student_feedback: Joi.number().integer().min(1).max(5).optional()
});

// POST /api/dmn/suggest - Get rest routine suggestion
router.post('/suggest', async (req: Request, res: Response) => {
  try {
    // Validate request
    const { error, value } = suggestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details
      });
    }

    const context = value;

    // Create or get active session
    let sessionResult = await query(
      `SELECT id FROM dmn_sessions
       WHERE student_id = $1
       AND module_id = $2
       AND session_end IS NULL
       ORDER BY session_start DESC
       LIMIT 1`,
      [context.student_id, context.module_id || null]
    );

    let sessionId: string;

    if (sessionResult.rows.length === 0) {
      // Create new session
      const newSession = await query(
        `INSERT INTO dmn_sessions (
          student_id, module_id, problem_complexity,
          problems_attempted, problems_correct,
          total_active_time_seconds
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id`,
        [
          context.student_id,
          context.module_id || null,
          context.problem_complexity,
          context.session_context.problems_attempted,
          context.session_context.problems_correct,
          Math.floor(context.session_context.active_time_minutes * 60)
        ]
      );
      sessionId = newSession.rows[0].id;
    } else {
      sessionId = sessionResult.rows[0].id;

      // Update session stats
      await query(
        `UPDATE dmn_sessions SET
          problems_attempted = $1,
          problems_correct = $2,
          total_active_time_seconds = $3,
          problem_complexity = GREATEST(problem_complexity, $4)
        WHERE id = $5`,
        [
          context.session_context.problems_attempted,
          context.session_context.problems_correct,
          Math.floor(context.session_context.active_time_minutes * 60),
          context.problem_complexity,
          sessionId
        ]
      );
    }

    // Get recommendation
    const { routine, trigger_reason, fatigue_score } = await recommendationEngine.recommendRoutine(context);

    if (!routine) {
      return res.status(404).json({
        success: false,
        error: 'No suitable routine found'
      });
    }

    // Record suggestion event
    const eventType = context.trigger_point === 'before' ? 'suggested_before' : 'suggested_after';
    const eventResult = await query(
      `INSERT INTO dmn_events (
        session_id, routine_id, event_type, trigger_reason, problem_id
      ) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [sessionId, routine.id, eventType, trigger_reason, context.problem_id || null]
    );

    const eventId = eventResult.rows[0].id;

    // Update session fatigue score
    await query(
      'UPDATE dmn_sessions SET fatigue_score = $1 WHERE id = $2',
      [fatigue_score, sessionId]
    );

    res.json({
      success: true,
      routine: {
        id: routine.id,
        name: routine.name,
        description: routine.description,
        duration_seconds: routine.duration_seconds,
        type: routine.type,
        instructions: routine.instructions,
        media_url: routine.media_url
      },
      trigger_reason,
      estimated_duration: routine.duration_seconds,
      session_id: sessionId,
      event_id: eventId
    });

  } catch (error) {
    logger.error('Error in /suggest endpoint', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/dmn/complete - Record routine completion
router.post('/complete', async (req: Request, res: Response) => {
  try {
    const { error, value } = completeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details
      });
    }

    const { event_id, completed, actual_duration_seconds, student_feedback } = value;

    // Update event
    const eventType = completed ? 'completed' : 'skipped';
    await query(
      `UPDATE dmn_events SET
        event_type = $1,
        completed_at = NOW(),
        actual_duration_seconds = $2,
        student_feedback = $3
      WHERE id = $4`,
      [eventType, actual_duration_seconds || null, student_feedback || null, event_id]
    );

    res.json({
      success: true,
      message: 'Rest routine completion recorded'
    });

  } catch (error) {
    logger.error('Error in /complete endpoint', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/dmn/routines - List all routines
router.get('/routines', async (req: Request, res: Response) => {
  try {
    const activeOnly = req.query.active_only === 'true';

    const result = await query(
      `SELECT id, name, description, duration_seconds, type, complexity_level, is_active
       FROM dmn_routines
       ${activeOnly ? 'WHERE is_active = true' : ''}
       ORDER BY complexity_level, duration_seconds`
    );

    res.json({
      success: true,
      routines: result.rows
    });

  } catch (error) {
    logger.error('Error in /routines endpoint', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/dmn/analytics - Get effectiveness analytics
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const { student_id, routine_id, start_date, end_date } = req.query;

    // Build query based on filters
    let analyticsQuery = `
      SELECT
        COUNT(CASE WHEN event_type IN ('suggested_before', 'suggested_after') THEN 1 END) as total_suggested,
        COUNT(CASE WHEN event_type = 'completed' THEN 1 END) as total_completed,
        COUNT(CASE WHEN event_type = 'skipped' THEN 1 END) as total_skipped,
        AVG(CASE WHEN event_type = 'completed' THEN actual_duration_seconds END) as avg_duration,
        AVG(CASE WHEN event_type = 'completed' THEN student_feedback END) as avg_feedback
      FROM dmn_events e
      JOIN dmn_sessions s ON e.session_id = s.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (student_id) {
      analyticsQuery += ` AND s.student_id = $${paramIndex}`;
      params.push(student_id);
      paramIndex++;
    }

    if (routine_id) {
      analyticsQuery += ` AND e.routine_id = $${paramIndex}`;
      params.push(routine_id);
      paramIndex++;
    }

    if (start_date) {
      analyticsQuery += ` AND e.suggested_at >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      analyticsQuery += ` AND e.suggested_at <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    const result = await query(analyticsQuery, params);
    const stats = result.rows[0];

    const totalSuggested = parseInt(stats.total_suggested) || 0;
    const totalCompleted = parseInt(stats.total_completed) || 0;
    const completionRate = totalSuggested > 0 ? totalCompleted / totalSuggested : 0;

    // Get top routines
    const topRoutinesResult = await query(
      `SELECT
        r.name as routine_name,
        COUNT(CASE WHEN e.event_type IN ('suggested_before', 'suggested_after') THEN 1 END) as suggested,
        COUNT(CASE WHEN e.event_type = 'completed' THEN 1 END) as completed,
        AVG(CASE WHEN e.event_type = 'completed' THEN e.student_feedback END) as avg_feedback
      FROM dmn_events e
      JOIN dmn_routines r ON e.routine_id = r.id
      GROUP BY r.id, r.name
      HAVING COUNT(CASE WHEN e.event_type IN ('suggested_before', 'suggested_after') THEN 1 END) > 0
      ORDER BY completed DESC
      LIMIT 5`
    );

    const topRoutines = topRoutinesResult.rows.map((row: any) => ({
      routine_name: row.routine_name,
      completion_rate: parseInt(row.suggested) > 0 ? parseInt(row.completed) / parseInt(row.suggested) : 0,
      avg_feedback: parseFloat(row.avg_feedback) || null
    }));

    res.json({
      success: true,
      analytics: {
        total_routines_suggested: totalSuggested,
        total_routines_completed: totalCompleted,
        total_routines_skipped: parseInt(stats.total_skipped) || 0,
        completion_rate: completionRate,
        avg_duration_seconds: parseFloat(stats.avg_duration) || null,
        avg_student_feedback: parseFloat(stats.avg_feedback) || null,
        top_routines: topRoutines
      }
    });

  } catch (error) {
    logger.error('Error in /analytics endpoint', { error });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
