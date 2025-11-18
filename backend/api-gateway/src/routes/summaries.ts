import { Router, Request, Response } from 'express';
import { db } from '../database';
import { logger } from '../utils/logger';
import axios from 'axios';

export const summariesRouter = Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Request summary generation for a step
summariesRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const { stepId, sessionId, language = 'ko' } = req.body;

    if (!stepId) {
      return res.status(400).json({ error: 'stepId is required' });
    }

    // Get step details and actions
    const stepResult = await db.query(
      'SELECT * FROM learning_steps WHERE id = $1',
      [stepId]
    );

    if (stepResult.rows.length === 0) {
      return res.status(404).json({ error: 'Step not found' });
    }

    const step = stepResult.rows[0];

    const actionsResult = await db.query(
      `SELECT * FROM learning_actions
       WHERE step_id = $1
       ORDER BY sequence_number ASC`,
      [stepId]
    );

    // Call AI service to generate summary
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/summarize`, {
      step,
      actions: actionsResult.rows,
      language,
    });

    const { summary, strategies, confidence } = aiResponse.data;

    // Save summary to database
    const summaryResult = await db.query(
      `INSERT INTO metacognitive_summaries
       (step_id, summary_text, summary_type, language, ai_model, generation_time_ms, confidence_score)
       VALUES ($1, $2, 'ai-generated', $3, $4, $5, $6)
       RETURNING *`,
      [
        stepId,
        summary,
        language,
        aiResponse.data.model || 'claude-3-sonnet',
        aiResponse.data.generation_time_ms || 0,
        confidence || null,
      ]
    );

    // Update step with summary and strategies
    await db.query(
      `UPDATE learning_steps
       SET metacognitive_summary = $1, cognitive_strategies = $2
       WHERE id = $3`,
      [summary, JSON.stringify(strategies || []), stepId]
    );

    res.status(201).json(summaryResult.rows[0]);
  } catch (err) {
    logger.error('Error generating summary:', err);

    // Fallback to template-based summary
    try {
      const templateSummary = generateTemplateSummary(req.body.stepType || 'unknown');
      res.status(200).json({
        summary_text: templateSummary,
        summary_type: 'template',
        note: 'AI service unavailable, using template',
      });
    } catch (fallbackErr) {
      res.status(500).json({ error: 'Failed to generate summary' });
    }
  }
});

// Get summaries for a session
summariesRouter.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const result = await db.query(
      `SELECT ms.*, ls.step_number, ls.step_type
       FROM metacognitive_summaries ms
       JOIN learning_steps ls ON ls.id = ms.step_id
       WHERE ls.session_id = $1
       ORDER BY ls.step_number ASC`,
      [sessionId]
    );

    res.json(result.rows);
  } catch (err) {
    logger.error('Error fetching summaries:', err);
    res.status(500).json({ error: 'Failed to fetch summaries' });
  }
});

// Template-based fallback summaries
function generateTemplateSummary(stepType: string): string {
  const templates: Record<string, string> = {
    'reading': '문제를 꼼꼼히 읽으며 이해하고 있어요.',
    'analyzing': '문제의 핵심 정보를 파악하고 있어요.',
    'strategy-planning': '문제 해결 전략을 수립하고 있어요.',
    'executing': '계획한 전략을 실행하고 있어요.',
    'verifying': '답을 검증하고 확인하고 있어요.',
    'reflecting': '풀이 과정을 되돌아보며 반성하고 있어요.',
    'unknown': '열심히 문제를 풀고 있어요.',
  };

  return templates[stepType] || templates['unknown'];
}
