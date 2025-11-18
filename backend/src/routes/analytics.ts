import express, { Request, Response } from 'express';
import axios from 'axios';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { query } from '../config/database';
import { logger } from '../utils/logger';

const router = express.Router();

const ANALYTICS_API_URL = process.env.ANALYTICS_API_URL || 'http://localhost:8001';

/**
 * GET /api/analytics/peak-periods/student/:studentId
 * Get all peak thinking periods for a student
 */
router.get(
  '/peak-periods/student/:studentId',
  asyncHandler(async (req: Request, res: Response) => {
    const { studentId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const peakPeriods = await query(
      `SELECT ptp.*, p.title as problem_title, ls.session_start
       FROM peak_thinking_periods ptp
       LEFT JOIN problems p ON ptp.problem_id = p.id
       LEFT JOIN learning_sessions ls ON ptp.session_id = ls.id
       WHERE ptp.student_id = ?
       ORDER BY ptp.period_start DESC
       LIMIT ?`,
      [studentId, limit]
    );

    res.json({
      status: 'success',
      data: { peak_periods: peakPeriods },
    });
  })
);

/**
 * GET /api/analytics/peak-periods/session/:sessionId
 * Get peak thinking periods for a specific session
 */
router.get(
  '/peak-periods/session/:sessionId',
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;

    const peakPeriods = await query(
      `SELECT * FROM peak_thinking_periods
       WHERE session_id = ?
       ORDER BY period_start ASC`,
      [sessionId]
    );

    res.json({
      status: 'success',
      data: { peak_periods: peakPeriods },
    });
  })
);

/**
 * POST /api/analytics/analyze-session/:sessionId
 * Trigger peak thinking period analysis for a session
 */
router.post(
  '/analyze-session/:sessionId',
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;

    // Check if session exists
    const sessions = await query(
      'SELECT * FROM learning_sessions WHERE id = ?',
      [sessionId]
    );

    if (sessions.length === 0) {
      throw new AppError('Session not found', 404);
    }

    const session = sessions[0];

    // Call analytics engine
    try {
      const response = await axios.post(
        `${ANALYTICS_API_URL}/analyze/session/${sessionId}`,
        {},
        {
          timeout: 30000, // 30 seconds
        }
      );

      logger.info(`Peak period analysis completed for session ${sessionId}`);

      res.json({
        status: 'success',
        message: 'Analysis completed',
        data: response.data,
      });
    } catch (error: any) {
      logger.error('Analytics engine error:', error.message);
      throw new AppError('Failed to analyze session', 500);
    }
  })
);

/**
 * GET /api/analytics/recent-peaks
 * Get recent peak periods across all students
 */
router.get(
  '/recent-peaks',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 100;

    const recentPeaks = await query(
      'SELECT * FROM v_recent_peak_periods LIMIT ?',
      [limit]
    );

    res.json({
      status: 'success',
      data: { recent_peaks: recentPeaks },
    });
  })
);

/**
 * GET /api/analytics/dashboard/student/:studentId
 * Get comprehensive analytics for a student
 */
router.get(
  '/dashboard/student/:studentId',
  asyncHandler(async (req: Request, res: Response) => {
    const { studentId } = req.params;

    // Get student analytics
    const analytics = await query(
      `SELECT * FROM student_analytics
       WHERE student_id = ?
       ORDER BY analysis_date DESC
       LIMIT 30`,
      [studentId]
    );

    // Get recent peak periods
    const recentPeaks = await query(
      `SELECT * FROM peak_thinking_periods
       WHERE student_id = ?
       ORDER BY period_start DESC
       LIMIT 10`,
      [studentId]
    );

    // Get performance summary
    const performance = await query(
      'SELECT * FROM v_student_performance WHERE student_id = ?',
      [studentId]
    );

    res.json({
      status: 'success',
      data: {
        analytics,
        recent_peaks: recentPeaks,
        performance: performance[0] || null,
      },
    });
  })
);

export default router;
