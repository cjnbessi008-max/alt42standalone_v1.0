import { Router, Request, Response } from 'express';
import { db } from '../database';
import { logger } from '../utils/logger';

export const stepsRouter = Router();

// Create new step
stepsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { sessionId, stepNumber, stepType, cognitiveStrategies } = req.body;

    if (!sessionId || !stepNumber || !stepType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await db.query(
      `INSERT INTO learning_steps (session_id, step_number, step_type, started_at, cognitive_strategies)
       VALUES ($1, $2, $3, NOW(), $4)
       RETURNING *`,
      [sessionId, stepNumber, stepType, JSON.stringify(cognitiveStrategies || [])]
    );

    // Update session total_steps
    await db.query(
      'UPDATE learning_sessions SET total_steps = $1 WHERE id = $2',
      [stepNumber, sessionId]
    );

    const step = result.rows[0];
    logger.info(`Created step ${step.id} (${stepType}) for session ${sessionId}`);

    res.status(201).json(step);
  } catch (err) {
    logger.error('Error creating step:', err);
    res.status(500).json({ error: 'Failed to create step' });
  }
});

// End step
stepsRouter.patch('/:stepId/end', async (req: Request, res: Response) => {
  try {
    const { stepId } = req.params;

    const result = await db.query(
      `UPDATE learning_steps
       SET ended_at = NOW(),
           duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))
       WHERE id = $1
       RETURNING *`,
      [stepId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Step not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Error ending step:', err);
    res.status(500).json({ error: 'Failed to end step' });
  }
});

// Get steps for session
stepsRouter.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const result = await db.query(
      `SELECT
        ls.*,
        COUNT(la.id) as action_count,
        ms.summary_text as current_summary
       FROM learning_steps ls
       LEFT JOIN learning_actions la ON la.step_id = ls.id
       LEFT JOIN metacognitive_summaries ms ON ms.step_id = ls.id
       WHERE ls.session_id = $1
       GROUP BY ls.id, ms.summary_text
       ORDER BY ls.step_number ASC`,
      [sessionId]
    );

    res.json(result.rows);
  } catch (err) {
    logger.error('Error fetching steps:', err);
    res.status(500).json({ error: 'Failed to fetch steps' });
  }
});

// Get current active step
stepsRouter.get('/session/:sessionId/current', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const result = await db.query(
      `SELECT * FROM learning_steps
       WHERE session_id = $1 AND ended_at IS NULL
       ORDER BY started_at DESC
       LIMIT 1`,
      [sessionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No active step found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Error fetching current step:', err);
    res.status(500).json({ error: 'Failed to fetch current step' });
  }
});
