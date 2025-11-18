/**
 * Sync Routes
 * Moodle 데이터 동기화 엔드포인트
 */

import express from 'express';
import { db } from '../index';
import { SyncService } from '../services/syncService';
import { logger } from '../utils/logger';

const router = express.Router();
const syncService = new SyncService(db);

/**
 * POST /api/sync/courses
 * 모든 코스 동기화
 */
router.post('/courses', async (req, res, next) => {
  try {
    logger.info('Starting course sync...');
    const result = await syncService.syncCourses();

    res.json({
      success: result.success,
      message: `Synced ${result.recordsSynced} courses`,
      details: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sync/quizzes/:courseId
 * 특정 코스의 퀴즈 동기화
 */
router.post('/quizzes/:courseId', async (req, res, next) => {
  try {
    const courseId = parseInt(req.params.courseId);

    if (isNaN(courseId)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    logger.info(`Starting quiz sync for course ${courseId}...`);
    const result = await syncService.syncQuizzes(courseId);

    res.json({
      success: result.success,
      message: `Synced ${result.recordsSynced} quizzes for course ${courseId}`,
      details: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sync/attempts/:quizId
 * 특정 퀴즈의 시도 동기화
 */
router.post('/attempts/:quizId', async (req, res, next) => {
  try {
    const quizId = parseInt(req.params.quizId);
    const userId = req.body.userId ? parseInt(req.body.userId) : undefined;

    if (isNaN(quizId)) {
      return res.status(400).json({ error: 'Invalid quiz ID' });
    }

    logger.info(`Starting quiz attempts sync for quiz ${quizId}...`);
    const result = await syncService.syncQuizAttempts(quizId, userId);

    res.json({
      success: result.success,
      message: `Synced ${result.recordsSynced} attempts for quiz ${quizId}`,
      details: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sync/status
 * 최근 동기화 상태 조회
 */
router.get('/status', async (req, res, next) => {
  try {
    const result = await db.query(
      `
      SELECT
        sync_type, entity_type, status,
        records_synced, records_failed,
        started_at, completed_at, duration_seconds
      FROM sync_logs
      ORDER BY started_at DESC
      LIMIT 10
      `
    );

    res.json({
      recentSyncs: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
