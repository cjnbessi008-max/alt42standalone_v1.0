import { Router, Request, Response } from 'express';
import { db } from '../database';
import { logger } from '../utils/logger';
import { publishActionEvent } from '../redis';
import Joi from 'joi';

export const actionsRouter = Router();

const createActionSchema = Joi.object({
  sessionId: Joi.string().uuid().required(),
  stepId: Joi.string().uuid().optional(),
  actionType: Joi.string().required(),
  actionData: Joi.object().required(),
  timestamp: Joi.date().iso().optional(),
  sequenceNumber: Joi.number().integer().optional(),
});

// Record learning action
actionsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { error, value } = createActionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { sessionId, stepId, actionType, actionData, timestamp } = value;

    // Get current sequence number for session
    const seqResult = await db.query(
      'SELECT COALESCE(MAX(sequence_number), 0) + 1 as next_seq FROM learning_actions WHERE session_id = $1',
      [sessionId]
    );
    const sequenceNumber = seqResult.rows[0].next_seq;

    const result = await db.query(
      `INSERT INTO learning_actions (session_id, step_id, action_type, action_data, timestamp, sequence_number)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        sessionId,
        stepId || null,
        actionType,
        JSON.stringify(actionData),
        timestamp || new Date(),
        sequenceNumber,
      ]
    );

    const action = result.rows[0];

    // Publish to Redis for real-time processing
    await publishActionEvent(action);

    res.status(201).json(action);
  } catch (err) {
    logger.error('Error recording action:', err);
    res.status(500).json({ error: 'Failed to record action' });
  }
});

// Get actions for a session
actionsRouter.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await db.query(
      `SELECT * FROM learning_actions
       WHERE session_id = $1
       ORDER BY sequence_number ASC
       LIMIT $2 OFFSET $3`,
      [sessionId, limit, offset]
    );

    res.json({
      actions: result.rows,
      total: result.rowCount,
      limit,
      offset,
    });
  } catch (err) {
    logger.error('Error fetching actions:', err);
    res.status(500).json({ error: 'Failed to fetch actions' });
  }
});

// Get actions for a step
actionsRouter.get('/step/:stepId', async (req: Request, res: Response) => {
  try {
    const { stepId } = req.params;

    const result = await db.query(
      `SELECT * FROM learning_actions
       WHERE step_id = $1
       ORDER BY sequence_number ASC`,
      [stepId]
    );

    res.json(result.rows);
  } catch (err) {
    logger.error('Error fetching step actions:', err);
    res.status(500).json({ error: 'Failed to fetch step actions' });
  }
});
