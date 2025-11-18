import { Router, Request, Response } from 'express';
import { db } from '../database';
import { logger } from '../utils/logger';
import Joi from 'joi';

export const sessionsRouter = Router();

// Validation schema
const createSessionSchema = Joi.object({
  studentId: Joi.string().uuid().required(),
  moduleId: Joi.string().uuid().required(),
  problemId: Joi.string().uuid().required(),
  lmsContext: Joi.object().optional(),
});

// Create new learning session
sessionsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { error, value } = createSessionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { studentId, moduleId, problemId, lmsContext } = value;

    const result = await db.query(
      `INSERT INTO learning_sessions (student_id, module_id, problem_id, status, lms_context)
       VALUES ($1, $2, $3, 'active', $4)
       RETURNING *`,
      [studentId, moduleId, problemId, JSON.stringify(lmsContext || {})]
    );

    const session = result.rows[0];
    logger.info(`Created session ${session.id} for student ${studentId}`);

    res.status(201).json(session);
  } catch (err) {
    logger.error('Error creating session:', err);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Get session by ID
sessionsRouter.get('/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const result = await db.query(
      'SELECT * FROM learning_sessions WHERE id = $1',
      [sessionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Error fetching session:', err);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// End session
sessionsRouter.patch('/:sessionId/end', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const result = await db.query(
      `UPDATE learning_sessions
       SET ended_at = NOW(), status = 'completed'
       WHERE id = $1
       RETURNING *`,
      [sessionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    logger.info(`Ended session ${sessionId}`);
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Error ending session:', err);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// Get session statistics
sessionsRouter.get('/:sessionId/stats', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const result = await db.query(
      `SELECT
        ls.id,
        ls.started_at,
        ls.ended_at,
        ls.total_steps,
        COUNT(DISTINCT la.id) as total_actions,
        EXTRACT(EPOCH FROM (COALESCE(ls.ended_at, NOW()) - ls.started_at)) as duration_seconds,
        json_agg(DISTINCT lst.step_type) as step_types_used
       FROM learning_sessions ls
       LEFT JOIN learning_steps lst ON lst.session_id = ls.id
       LEFT JOIN learning_actions la ON la.session_id = ls.id
       WHERE ls.id = $1
       GROUP BY ls.id`,
      [sessionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Error fetching session stats:', err);
    res.status(500).json({ error: 'Failed to fetch session statistics' });
  }
});
