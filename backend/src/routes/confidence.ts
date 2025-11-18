/**
 * Confidence Routes
 * 확신도 평가 관련 엔드포인트
 */

import express from 'express';
import { db } from '../index';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * POST /api/confidence/rate
 * 확신도 평가 제출
 */
router.post('/rate', async (req, res, next) => {
  try {
    const { questionAttemptId, confidenceLevel } = req.body;

    if (!questionAttemptId || !confidenceLevel) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (confidenceLevel < 1 || confidenceLevel > 5) {
      return res.status(400).json({ error: 'Confidence level must be between 1 and 5' });
    }

    // Update question attempt with confidence level
    const result = await db.query(
      `
      UPDATE question_attempts
      SET confidence_level = $1, confidence_collected_at = NOW()
      WHERE id = $2
      RETURNING *
      `,
      [confidenceLevel, questionAttemptId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question attempt not found' });
    }

    res.json({
      success: true,
      message: 'Confidence rating saved',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/confidence/missing
 * 확신도 미수집 문제 목록
 */
router.get('/missing', async (req, res, next) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    const result = await db.query(
      `
      SELECT
        qa.id,
        q.question_text,
        qz.name as quiz_name,
        qa.created_at
      FROM question_attempts qa
      JOIN questions q ON qa.question_id = q.id
      JOIN quizzes qz ON q.quiz_id = qz.id
      WHERE qa.user_id = $1
        AND qa.confidence_level IS NULL
      ORDER BY qa.created_at DESC
      LIMIT 20
      `,
      [userId]
    );

    res.json({
      missingCount: result.rows.length,
      questions: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/confidence/batch
 * 확신도 일괄 제출
 */
router.post('/batch', async (req, res, next) => {
  try {
    const { ratings } = req.body; // Array of { questionAttemptId, confidenceLevel }

    if (!Array.isArray(ratings) || ratings.length === 0) {
      return res.status(400).json({ error: 'Invalid ratings array' });
    }

    const results = [];

    for (const rating of ratings) {
      try {
        await db.query(
          `
          UPDATE question_attempts
          SET confidence_level = $1, confidence_collected_at = NOW()
          WHERE id = $2
          `,
          [rating.confidenceLevel, rating.questionAttemptId]
        );
        results.push({ id: rating.questionAttemptId, success: true });
      } catch (error: any) {
        results.push({ id: rating.questionAttemptId, success: false, error: error.message });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    res.json({
      success: true,
      message: `Saved ${successCount} of ${ratings.length} confidence ratings`,
      results,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
