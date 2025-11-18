/**
 * Focus Session Routes
 * API routes for focus session management
 */

import { Router } from 'express';
import { FocusSessionController } from '../controllers/focusSessionController';
import { Pool } from 'pg';

export function createFocusSessionRoutes(pool: Pool): Router {
  const router = Router();
  const controller = new FocusSessionController(pool);

  // Session management
  router.post('/focus-sessions', controller.createSession);
  router.get('/focus-sessions/:sessionId', controller.getSession);
  router.put('/focus-sessions/:sessionId/metrics', controller.updateMetrics);
  router.put('/focus-sessions/:sessionId/end', controller.endSession);

  // User endpoints
  router.get('/focus-sessions/user/:userId', controller.getUserSessions);
  router.get('/focus-sessions/user/:userId/stats', controller.getUserStats);

  // Course analytics
  router.get('/focus-sessions/course/:courseId/analytics', controller.getCourseAnalytics);

  // Leaderboard
  router.get('/focus-sessions/leaderboard', controller.getLeaderboard);

  return router;
}
