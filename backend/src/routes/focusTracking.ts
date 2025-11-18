import { Router, Request, Response } from 'express';
import { FocusTrackingController } from '../controllers/focusTrackingController';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, query } from 'express-validator';

const router = Router();
const controller = new FocusTrackingController();

/**
 * 집중 추적 이벤트 검증 규칙
 */
const eventValidationRules = [
  body('events').isArray().withMessage('Events must be an array'),
  body('events.*.eventType')
    .isIn([
      'focus_lost',
      'focus_regained',
      'idle_detected',
      'break_started',
      'break_completed',
      'break_skipped',
    ])
    .withMessage('Invalid event type'),
  body('events.*.timestamp').isInt().withMessage('Timestamp must be a number'),
  body('events.*.studentId').notEmpty().withMessage('Student ID is required'),
  body('events.*.moduleId').notEmpty().withMessage('Module ID is required'),
  body('events.*.sessionId').notEmpty().withMessage('Session ID is required'),
];

/**
 * 통계 조회 검증 규칙
 */
const statisticsValidationRules = [
  query('studentId').notEmpty().withMessage('Student ID is required'),
  query('moduleId').notEmpty().withMessage('Module ID is required'),
];

/**
 * POST /api/focus-tracking/events
 * 집중 추적 이벤트 기록
 */
router.post(
  '/events',
  authMiddleware,
  eventValidationRules,
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      await controller.logEvents(req, res);
    } catch (error) {
      console.error('Error logging focus tracking events:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to log focus tracking events',
      });
    }
  }
);

/**
 * GET /api/focus-tracking/statistics
 * 학생의 집중도 통계 조회
 */
router.get(
  '/statistics',
  authMiddleware,
  statisticsValidationRules,
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      await controller.getStatistics(req, res);
    } catch (error) {
      console.error('Error fetching focus statistics:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch focus statistics',
      });
    }
  }
);

/**
 * GET /api/focus-tracking/sessions/:sessionId
 * 세션 상세 정보 조회
 */
router.get(
  '/sessions/:sessionId',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      await controller.getSessionDetails(req, res);
    } catch (error) {
      console.error('Error fetching session details:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch session details',
      });
    }
  }
);

/**
 * GET /api/focus-tracking/reports/daily
 * 일별 집중도 리포트
 */
router.get(
  '/reports/daily',
  authMiddleware,
  [
    query('studentId').notEmpty().withMessage('Student ID is required'),
    query('date').isISO8601().withMessage('Valid date is required'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      await controller.getDailyReport(req, res);
    } catch (error) {
      console.error('Error fetching daily report:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch daily report',
      });
    }
  }
);

/**
 * GET /api/focus-tracking/reports/module
 * 모듈별 집중도 리포트
 */
router.get(
  '/reports/module',
  authMiddleware,
  [query('moduleId').notEmpty().withMessage('Module ID is required')],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      await controller.getModuleReport(req, res);
    } catch (error) {
      console.error('Error fetching module report:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch module report',
      });
    }
  }
);

export default router;
