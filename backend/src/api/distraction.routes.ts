/**
 * Distraction Detection API Routes
 *
 * Endpoints for managing distraction events, marks, and analytics
 *
 * Routes:
 * - POST   /api/modules/:moduleId/distraction-events
 * - POST   /api/modules/:moduleId/distraction-events/batch
 * - GET    /api/modules/:moduleId/distraction-events
 * - POST   /api/modules/:moduleId/distraction-marks
 * - GET    /api/modules/:moduleId/distraction-marks
 * - PUT    /api/modules/:moduleId/distraction-marks/:markId
 * - GET    /api/modules/:moduleId/student/:studentId/distraction-summary
 * - GET    /api/modules/:moduleId/distraction-analytics
 * - PUT    /api/modules/:moduleId/distraction-thresholds
 * - GET    /api/modules/:moduleId/distraction-thresholds
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { DistractionService } from '../services/distraction.service';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();
const distractionService = new DistractionService();

// ============================================================================
// Middleware
// ============================================================================

/**
 * Validation error handler
 */
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// ============================================================================
// Event Endpoints
// ============================================================================

/**
 * POST /api/modules/:moduleId/distraction-events
 * Create a single distraction event
 */
router.post(
  '/modules/:moduleId/distraction-events',
  authMiddleware,
  [
    param('moduleId').isUUID(),
    body('studentId').isUUID(),
    body('sessionId').isUUID(),
    body('eventType').isIn([
      'page_blur',
      'tab_switch',
      'mouse_idle',
      'keyboard_idle',
      'inactivity',
      'window_resize',
      'copy_paste',
      'context_menu',
      'devtools_open',
    ]),
    body('durationSeconds').isInt({ min: 0 }),
    body('metadata').optional().isObject(),
    body('problemContext').optional().isObject(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { moduleId } = req.params;
      const eventData = {
        ...req.body,
        moduleId,
      };

      const event = await distractionService.createEvent(eventData);

      res.status(201).json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/modules/:moduleId/distraction-events/batch
 * Create multiple distraction events in batch
 */
router.post(
  '/modules/:moduleId/distraction-events/batch',
  authMiddleware,
  [
    param('moduleId').isUUID(),
    body('events').isArray({ min: 1, max: 100 }),
    body('events.*.studentId').isUUID(),
    body('events.*.sessionId').isUUID(),
    body('events.*.eventType').isIn([
      'page_blur',
      'tab_switch',
      'mouse_idle',
      'keyboard_idle',
      'inactivity',
      'window_resize',
      'copy_paste',
      'context_menu',
      'devtools_open',
    ]),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { moduleId } = req.params;
      const { events } = req.body;

      const eventsWithModuleId = events.map((event: any) => ({
        ...event,
        moduleId,
      }));

      const created = await distractionService.createEventsBatch(eventsWithModuleId);

      res.status(201).json({
        success: true,
        data: {
          count: created.length,
          events: created,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/modules/:moduleId/distraction-events
 * Get distraction events with filtering
 */
router.get(
  '/modules/:moduleId/distraction-events',
  authMiddleware,
  requireRole(['teacher', 'admin']),
  [
    param('moduleId').isUUID(),
    query('studentId').optional().isUUID(),
    query('sessionId').optional().isUUID(),
    query('eventType').optional().isString(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('unmarkedOnly').optional().isBoolean(),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { moduleId } = req.params;
      const filters = {
        moduleId,
        studentId: req.query.studentId as string,
        sessionId: req.query.sessionId as string,
        eventType: req.query.eventType as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        unmarkedOnly: req.query.unmarkedOnly === 'true',
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0,
      };

      const result = await distractionService.getEvents(filters);

      res.json({
        success: true,
        data: result.events,
        pagination: {
          total: result.total,
          limit: filters.limit,
          offset: filters.offset,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// Marking Endpoints
// ============================================================================

/**
 * POST /api/modules/:moduleId/distraction-marks
 * Create a distraction mark (teacher annotation)
 */
router.post(
  '/modules/:moduleId/distraction-marks',
  authMiddleware,
  requireRole(['teacher', 'admin']),
  [
    param('moduleId').isUUID(),
    body('distractionEventId').isUUID(),
    body('studentId').isUUID(),
    body('category').isIn([
      'legitimate_break',
      'off_task',
      'technical_issue',
      'external_interruption',
      'confusion',
      'cheating_attempt',
      'false_positive',
      'other',
    ]),
    body('severity').isIn(['critical', 'major', 'moderate', 'minor']),
    body('contextNotes').optional().isString(),
    body('rootCauseAnalysis').optional().isString(),
    body('actionTaken').optional().isString(),
    body('interventionRecommended').optional().isBoolean(),
    body('interventionType').optional().isString(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { moduleId } = req.params;
      const markData = {
        ...req.body,
        moduleId,
        markedByUserId: req.user!.id, // From auth middleware
      };

      const mark = await distractionService.createMark(markData);

      res.status(201).json({
        success: true,
        data: mark,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/modules/:moduleId/distraction-marks
 * Get distraction marks with filtering
 */
router.get(
  '/modules/:moduleId/distraction-marks',
  authMiddleware,
  requireRole(['teacher', 'admin']),
  [
    param('moduleId').isUUID(),
    query('studentId').optional().isUUID(),
    query('category').optional().isString(),
    query('severity').optional().isString(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { moduleId } = req.params;
      const filters = {
        moduleId,
        studentId: req.query.studentId as string,
        category: req.query.category as string,
        severity: req.query.severity as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0,
      };

      const result = await distractionService.getMarks(filters);

      res.json({
        success: true,
        data: result.marks,
        pagination: {
          total: result.total,
          limit: filters.limit,
          offset: filters.offset,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/modules/:moduleId/distraction-marks/:markId
 * Update a distraction mark
 */
router.put(
  '/modules/:moduleId/distraction-marks/:markId',
  authMiddleware,
  requireRole(['teacher', 'admin']),
  [
    param('moduleId').isUUID(),
    param('markId').isUUID(),
    body('category').optional().isString(),
    body('severity').optional().isString(),
    body('contextNotes').optional().isString(),
    body('rootCauseAnalysis').optional().isString(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { markId } = req.params;
      const updateData = {
        ...req.body,
        updatedByUserId: req.user!.id,
      };

      const mark = await distractionService.updateMark(markId, updateData);

      res.json({
        success: true,
        data: mark,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// Analytics Endpoints
// ============================================================================

/**
 * GET /api/modules/:moduleId/student/:studentId/distraction-summary
 * Get distraction summary for a specific student
 */
router.get(
  '/modules/:moduleId/student/:studentId/distraction-summary',
  authMiddleware,
  requireRole(['teacher', 'admin']),
  [param('moduleId').isUUID(), param('studentId').isUUID()],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { moduleId, studentId } = req.params;

      const summary = await distractionService.getStudentSummary(moduleId, studentId);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/modules/:moduleId/distraction-analytics
 * Get analytics for the module
 */
router.get(
  '/modules/:moduleId/distraction-analytics',
  authMiddleware,
  requireRole(['teacher', 'admin']),
  [
    param('moduleId').isUUID(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('groupBy').optional().isIn(['day', 'week', 'month']),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { moduleId } = req.params;
      const options = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        groupBy: (req.query.groupBy as string) || 'day',
      };

      const analytics = await distractionService.getModuleAnalytics(moduleId, options);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================================
// Threshold Configuration Endpoints
// ============================================================================

/**
 * GET /api/modules/:moduleId/distraction-thresholds
 * Get distraction thresholds for a module
 */
router.get(
  '/modules/:moduleId/distraction-thresholds',
  authMiddleware,
  requireRole(['teacher', 'admin']),
  [param('moduleId').isUUID()],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { moduleId } = req.params;

      const thresholds = await distractionService.getThresholds(moduleId);

      res.json({
        success: true,
        data: thresholds,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/modules/:moduleId/distraction-thresholds
 * Update distraction thresholds for a module
 */
router.put(
  '/modules/:moduleId/distraction-thresholds',
  authMiddleware,
  requireRole(['teacher', 'admin']),
  [
    param('moduleId').isUUID(),
    body('criticalPercentage').optional().isFloat({ min: 0, max: 100 }),
    body('warningPercentage').optional().isFloat({ min: 0, max: 100 }),
    body('minorPercentage').optional().isFloat({ min: 0, max: 100 }),
    body('autoPauseOnCritical').optional().isBoolean(),
    body('sendTeacherAlerts').optional().isBoolean(),
    body('sendStudentReminders').optional().isBoolean(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { moduleId } = req.params;
      const teacherId = req.user!.id;

      const thresholds = await distractionService.updateThresholds(moduleId, teacherId, req.body);

      res.json({
        success: true,
        data: thresholds,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
