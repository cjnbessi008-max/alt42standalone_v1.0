/**
 * Calming Message API Routes
 * Handles configuration, interaction logging, and analytics for calming messages
 */

import express, { Request, Response, Router } from 'express';
import path from 'path';
import { Pool } from 'pg';

const router: Router = express.Router();

// Database connection pool (should be imported from config in production)
// This is a placeholder - actual DB config should be in config/database.ts
let db: Pool;

export const setCalmingMessageDB = (pool: Pool) => {
  db = pool;
};

/**
 * GET /api/modules/:moduleId/calming-config
 * Purpose: Get calming message configuration for a module
 * Response: CalmingMessageConfig object
 */
router.get('/modules/:moduleId/calming-config', async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;

    const result = await db.query(
      'SELECT * FROM module_calming_config WHERE module_id = $1',
      [moduleId]
    );

    if (result.rows.length === 0) {
      // Return default configuration if not found
      return res.json({
        module_id: moduleId,
        is_enabled: true,
        difficulty_threshold: 4,
        message_templates: {
          "4": "이 문제는 어렵지만 당신은 할 수 있어요! 깊게 숨을 쉬고 한 단계씩 시도해보세요.",
          "5": "이것은 도전적이지만, 당신에게는 실력이 있습니다. 신중하게 생각하고 계속 노력하세요!"
        },
        audio_enabled: true,
        text_enabled: true,
        animation_type: 'breathing_circle',
        timeout_seconds: 10
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching calming message config:', error);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
});

/**
 * POST /api/modules/:moduleId/calming-config
 * Purpose: Update calming message configuration (teacher only)
 * Body: CalmingMessageConfig updates
 * Requires: Teacher authentication (middleware should be added)
 */
router.post('/modules/:moduleId/calming-config', async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;
    const {
      is_enabled,
      difficulty_threshold,
      message_templates,
      audio_enabled,
      text_enabled,
      animation_type,
      timeout_seconds
    } = req.body;

    // Validate difficulty_threshold
    if (difficulty_threshold && (difficulty_threshold < 1 || difficulty_threshold > 5)) {
      return res.status(400).json({ error: 'difficulty_threshold must be between 1 and 5' });
    }

    // Upsert configuration
    const result = await db.query(
      `INSERT INTO module_calming_config
       (module_id, is_enabled, difficulty_threshold, message_templates,
        audio_enabled, text_enabled, animation_type, timeout_seconds)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (module_id) DO UPDATE SET
         is_enabled = COALESCE($2, module_calming_config.is_enabled),
         difficulty_threshold = COALESCE($3, module_calming_config.difficulty_threshold),
         message_templates = COALESCE($4, module_calming_config.message_templates),
         audio_enabled = COALESCE($5, module_calming_config.audio_enabled),
         text_enabled = COALESCE($6, module_calming_config.text_enabled),
         animation_type = COALESCE($7, module_calming_config.animation_type),
         timeout_seconds = COALESCE($8, module_calming_config.timeout_seconds),
         updated_at = NOW()
       RETURNING *`,
      [
        moduleId,
        is_enabled,
        difficulty_threshold,
        message_templates,
        audio_enabled,
        text_enabled,
        animation_type,
        timeout_seconds
      ]
    );

    res.json({ success: true, config: result.rows[0] });
  } catch (error) {
    console.error('Error updating calming message config:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

/**
 * GET /api/modules/:moduleId/audio/calming_message_:level
 * Purpose: Serve pre-generated calming message audio file
 * Response: MP3 audio file stream
 * Example: GET /api/modules/abc123/audio/calming_message_4
 */
router.get('/modules/:moduleId/audio/calming_message_:level', async (req: Request, res: Response) => {
  try {
    const { level } = req.params;

    // Validate level
    const levelNum = parseInt(level);
    if (isNaN(levelNum) || levelNum < 1 || levelNum > 5) {
      return res.status(400).json({ error: 'Invalid difficulty level' });
    }

    // Path to audio file
    const audioPath = path.join(
      process.cwd(),
      'public',
      'audio',
      'calming_messages',
      `difficulty_${level}.mp3`
    );

    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(audioPath)) {
      return res.status(404).json({ error: 'Audio file not found' });
    }

    // Stream audio file
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Accept-Ranges', 'bytes');

    const fileStream = fs.createReadStream(audioPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error serving audio file:', error);
    res.status(500).json({ error: 'Failed to serve audio file' });
  }
});

/**
 * POST /api/modules/:moduleId/interactions/calming_message
 * Purpose: Log when a calming message is shown to a student
 * Body: { student_id, problem_id, difficulty_level, message_type }
 */
router.post('/modules/:moduleId/interactions/calming_message', async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;
    const { student_id, problem_id, difficulty_level, message_type } = req.body;

    // Validate required fields
    if (!student_id || !problem_id || !difficulty_level) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await db.query(
      `INSERT INTO calming_message_interactions
       (module_id, student_id, problem_id, difficulty_level, message_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [moduleId, student_id, problem_id, difficulty_level, message_type || 'combined']
    );

    res.json({ success: true, interaction_id: result.rows[0].id });
  } catch (error) {
    console.error('Error logging calming message interaction:', error);
    res.status(500).json({ error: 'Failed to log interaction' });
  }
});

/**
 * PUT /api/modules/:moduleId/interactions/calming_message/:interactionId
 * Purpose: Update interaction (e.g., log view duration, student feedback)
 * Body: { duration_viewed_seconds, student_feedback }
 */
router.put(
  '/modules/:moduleId/interactions/calming_message/:interactionId',
  async (req: Request, res: Response) => {
    try {
      const { interactionId } = req.params;
      const { duration_viewed_seconds, student_feedback, student_continued_immediately } = req.body;

      const result = await db.query(
        `UPDATE calming_message_interactions
         SET duration_viewed_seconds = COALESCE($1, duration_viewed_seconds),
             student_feedback = COALESCE($2, student_feedback),
             student_continued_immediately = COALESCE($3, student_continued_immediately),
             feedback_at = CASE WHEN $2 IS NOT NULL THEN NOW() ELSE feedback_at END
         WHERE id = $4
         RETURNING *`,
        [duration_viewed_seconds, student_feedback, student_continued_immediately, interactionId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Interaction not found' });
      }

      res.json({ success: true, interaction: result.rows[0] });
    } catch (error) {
      console.error('Error updating calming message interaction:', error);
      res.status(500).json({ error: 'Failed to update interaction' });
    }
  }
);

/**
 * GET /api/modules/:moduleId/analytics/calming_messages
 * Purpose: Show analytics dashboard for teachers
 * Response: Aggregated statistics about calming message effectiveness
 */
router.get('/modules/:moduleId/analytics/calming_messages', async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;

    // Overall statistics
    const stats = await db.query(
      `SELECT
        COUNT(*) as total_shown,
        AVG(duration_viewed_seconds) as avg_view_duration,
        SUM(CASE WHEN student_feedback = true THEN 1 ELSE 0 END) as helpful_count,
        SUM(CASE WHEN student_feedback = false THEN 1 ELSE 0 END) as not_helpful_count,
        SUM(CASE WHEN student_continued_immediately = true THEN 1 ELSE 0 END) as immediate_continue_count,
        difficulty_level,
        COUNT(DISTINCT student_id) as unique_students
      FROM calming_message_interactions
      WHERE module_id = $1
      GROUP BY difficulty_level
      ORDER BY difficulty_level`,
      [moduleId]
    );

    // Recent interactions
    const recentInteractions = await db.query(
      `SELECT
        student_id,
        problem_id,
        difficulty_level,
        message_type,
        shown_at,
        duration_viewed_seconds,
        student_feedback
      FROM calming_message_interactions
      WHERE module_id = $1
      ORDER BY shown_at DESC
      LIMIT 50`,
      [moduleId]
    );

    res.json({
      stats: stats.rows,
      recent_interactions: recentInteractions.rows,
      summary: {
        total_interactions: stats.rows.reduce((sum, row) => sum + parseInt(row.total_shown), 0),
        average_helpfulness: calculateHelpfulnessRate(stats.rows),
        most_common_difficulty: findMostCommonDifficulty(stats.rows)
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * GET /api/modules/:moduleId/problems/:problemId/difficulty
 * Purpose: Get difficulty level for a specific problem
 */
router.get('/modules/:moduleId/problems/:problemId/difficulty', async (req: Request, res: Response) => {
  try {
    const { problemId } = req.params;

    const result = await db.query(
      'SELECT difficulty_level, requires_calming_support FROM problem_metadata WHERE problem_id = $1',
      [problemId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching problem difficulty:', error);
    res.status(500).json({ error: 'Failed to fetch problem difficulty' });
  }
});

// Helper functions
function calculateHelpfulnessRate(stats: any[]): number {
  const totalFeedback = stats.reduce(
    (sum, row) => sum + parseInt(row.helpful_count) + parseInt(row.not_helpful_count),
    0
  );
  const totalHelpful = stats.reduce((sum, row) => sum + parseInt(row.helpful_count), 0);

  return totalFeedback > 0 ? (totalHelpful / totalFeedback) * 100 : 0;
}

function findMostCommonDifficulty(stats: any[]): number | null {
  if (stats.length === 0) return null;

  const maxStat = stats.reduce((max, row) =>
    parseInt(row.total_shown) > parseInt(max.total_shown) ? row : max
  );

  return maxStat.difficulty_level;
}

export default router;
