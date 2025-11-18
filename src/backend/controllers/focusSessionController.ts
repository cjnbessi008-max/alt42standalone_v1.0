/**
 * Focus Session Controller
 * Handles focus session CRUD operations and analytics
 */

import { Request, Response } from 'express';
import { Pool } from 'pg';

export class FocusSessionController {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Create a new focus session
   * POST /api/focus-sessions
   */
  createSession = async (req: Request, res: Response) => {
    const { userId, courseId, metadata = {} } = req.body;

    if (!userId || !courseId) {
      return res.status(400).json({
        error: 'Missing required fields: userId and courseId are required',
      });
    }

    try {
      const result = await this.pool.query(
        `INSERT INTO focus_sessions (user_id, course_id, metadata)
         VALUES ($1, $2, $3)
         RETURNING id, user_id, course_id, start_time, created_at`,
        [userId, courseId, JSON.stringify(metadata)]
      );

      const session = result.rows[0];

      return res.status(201).json({
        sessionId: session.id,
        userId: session.user_id,
        courseId: session.course_id,
        startTime: session.start_time,
        message: 'Focus session created successfully',
      });
    } catch (error) {
      console.error('Error creating focus session:', error);
      return res.status(500).json({
        error: 'Failed to create focus session',
      });
    }
  };

  /**
   * Update session metrics
   * PUT /api/focus-sessions/:sessionId/metrics
   */
  updateMetrics = async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const { blinkCount, blinksPerMinute, focusState, confidenceScore, metadata = {} } = req.body;

    if (!blinkCount || !blinksPerMinute || !focusState) {
      return res.status(400).json({
        error: 'Missing required fields: blinkCount, blinksPerMinute, focusState',
      });
    }

    try {
      // Insert metrics
      await this.pool.query(
        `INSERT INTO blink_metrics
         (session_id, blink_count, blinks_per_minute, focus_state, confidence_score, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          sessionId,
          blinkCount,
          blinksPerMinute,
          focusState,
          confidenceScore || null,
          JSON.stringify(metadata),
        ]
      );

      // Update session total blinks
      await this.pool.query(
        `UPDATE focus_sessions
         SET total_blinks = (
           SELECT SUM(blink_count) FROM blink_metrics WHERE session_id = $1
         )
         WHERE id = $1`,
        [sessionId]
      );

      return res.status(200).json({
        success: true,
        message: 'Metrics updated successfully',
      });
    } catch (error) {
      console.error('Error updating metrics:', error);
      return res.status(500).json({
        error: 'Failed to update metrics',
      });
    }
  };

  /**
   * End a focus session
   * PUT /api/focus-sessions/:sessionId/end
   */
  endSession = async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const { endTime } = req.body;

    try {
      // Calculate session metrics
      const metricsResult = await this.pool.query(
        `SELECT
           AVG(blinks_per_minute) as avg_blink_rate,
           MAX(CASE WHEN focus_state = 'focused' THEN 1 ELSE 0 END) as had_focus
         FROM blink_metrics
         WHERE session_id = $1`,
        [sessionId]
      );

      const avgBlinkRate = metricsResult.rows[0]?.avg_blink_rate || 0;

      // Update session with end time and metrics
      const updateResult = await this.pool.query(
        `UPDATE focus_sessions
         SET
           end_time = COALESCE($2::timestamp, NOW()),
           duration_seconds = EXTRACT(EPOCH FROM (COALESCE($2::timestamp, NOW()) - start_time))::INTEGER,
           avg_blink_rate = $3
         WHERE id = $1
         RETURNING id, user_id, course_id, start_time, end_time, duration_seconds, avg_blink_rate`,
        [sessionId, endTime || null, avgBlinkRate]
      );

      if (updateResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Session not found',
        });
      }

      const session = updateResult.rows[0];

      // Calculate focus score
      const scoreResult = await this.pool.query(
        `SELECT calculate_focus_score($1) as score`,
        [sessionId]
      );
      const focusScore = scoreResult.rows[0].score;

      // Update session with score
      await this.pool.query(
        `UPDATE focus_sessions SET focus_score = $2 WHERE id = $1`,
        [sessionId, focusScore]
      );

      // Update user statistics
      await this.pool.query(
        `SELECT update_user_focus_stats($1, $2)`,
        [session.user_id, sessionId]
      );

      return res.status(200).json({
        sessionId: session.id,
        userId: session.user_id,
        courseId: session.course_id,
        startTime: session.start_time,
        endTime: session.end_time,
        duration: session.duration_seconds,
        avgBlinkRate: parseFloat(session.avg_blink_rate),
        focusScore,
        message: 'Session ended successfully',
      });
    } catch (error) {
      console.error('Error ending session:', error);
      return res.status(500).json({
        error: 'Failed to end session',
      });
    }
  };

  /**
   * Get user's focus session history
   * GET /api/focus-sessions/user/:userId
   */
  getUserSessions = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    try {
      const result = await this.pool.query(
        `SELECT
           id,
           course_id,
           start_time,
           end_time,
           duration_seconds,
           avg_blink_rate,
           focus_score,
           total_blinks
         FROM focus_sessions
         WHERE user_id = $1
         ORDER BY start_time DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      const countResult = await this.pool.query(
        `SELECT COUNT(*) as total FROM focus_sessions WHERE user_id = $1`,
        [userId]
      );

      return res.status(200).json({
        sessions: result.rows,
        total: parseInt(countResult.rows[0].total),
        limit,
        offset,
      });
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      return res.status(500).json({
        error: 'Failed to fetch sessions',
      });
    }
  };

  /**
   * Get session details with metrics
   * GET /api/focus-sessions/:sessionId
   */
  getSession = async (req: Request, res: Response) => {
    const { sessionId } = req.params;

    try {
      // Get session
      const sessionResult = await this.pool.query(
        `SELECT * FROM focus_sessions WHERE id = $1`,
        [sessionId]
      );

      if (sessionResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Session not found',
        });
      }

      // Get metrics
      const metricsResult = await this.pool.query(
        `SELECT
           timestamp,
           blink_count,
           blinks_per_minute,
           focus_state,
           confidence_score
         FROM blink_metrics
         WHERE session_id = $1
         ORDER BY timestamp ASC`,
        [sessionId]
      );

      return res.status(200).json({
        session: sessionResult.rows[0],
        metrics: metricsResult.rows,
      });
    } catch (error) {
      console.error('Error fetching session:', error);
      return res.status(500).json({
        error: 'Failed to fetch session',
      });
    }
  };

  /**
   * Get user statistics
   * GET /api/focus-sessions/user/:userId/stats
   */
  getUserStats = async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
      const result = await this.pool.query(
        `SELECT * FROM user_focus_stats WHERE user_id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(200).json({
          userId,
          stats: null,
          message: 'No statistics available yet',
        });
      }

      return res.status(200).json({
        userId,
        stats: result.rows[0],
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return res.status(500).json({
        error: 'Failed to fetch user statistics',
      });
    }
  };

  /**
   * Get course analytics
   * GET /api/focus-sessions/course/:courseId/analytics
   */
  getCourseAnalytics = async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const days = parseInt(req.query.days as string) || 30;

    try {
      const result = await this.pool.query(
        `SELECT
           DATE(start_time) as date,
           COUNT(*) as sessions,
           COUNT(DISTINCT user_id) as unique_users,
           AVG(focus_score)::DECIMAL(5,2) as avg_focus_score,
           AVG(duration_seconds)::INTEGER as avg_duration_seconds,
           AVG(avg_blink_rate)::DECIMAL(5,2) as avg_blink_rate
         FROM focus_sessions
         WHERE course_id = $1
           AND start_time >= NOW() - INTERVAL '1 day' * $2
         GROUP BY DATE(start_time)
         ORDER BY date DESC`,
        [courseId, days]
      );

      return res.status(200).json({
        courseId,
        days,
        analytics: result.rows,
      });
    } catch (error) {
      console.error('Error fetching course analytics:', error);
      return res.status(500).json({
        error: 'Failed to fetch course analytics',
      });
    }
  };

  /**
   * Get leaderboard
   * GET /api/focus-sessions/leaderboard
   */
  getLeaderboard = async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const metric = (req.query.metric as string) || 'avg_focus_score';

    const validMetrics = ['avg_focus_score', 'total_focus_time_seconds', 'total_sessions'];
    if (!validMetrics.includes(metric)) {
      return res.status(400).json({
        error: `Invalid metric. Must be one of: ${validMetrics.join(', ')}`,
      });
    }

    try {
      const result = await this.pool.query(
        `SELECT
           user_id,
           total_sessions,
           total_focus_time_seconds,
           avg_focus_score,
           best_focus_duration_seconds,
           last_session_at
         FROM user_focus_stats
         ORDER BY ${metric} DESC
         LIMIT $1`,
        [limit]
      );

      return res.status(200).json({
        metric,
        leaderboard: result.rows,
      });
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return res.status(500).json({
        error: 'Failed to fetch leaderboard',
      });
    }
  };
}
