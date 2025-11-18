import { Request, Response, NextFunction } from 'express';
import timelineService from '../services/timeline.service';
import { TimelineEvent, TimelineQuery } from '../models/timeline.model';

export class TimelineController {
  /**
   * POST /api/timeline/events
   * Record a single timeline event
   */
  async recordEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const event: TimelineEvent = req.body;

      // Validate required fields
      if (!event.student_id || !event.module_id || !event.problem_id ||
          !event.session_id || !event.event_type || !event.sequence_number) {
        res.status(400).json({
          error: 'Missing required fields',
          required: ['student_id', 'module_id', 'problem_id', 'session_id', 'event_type', 'sequence_number']
        });
        return;
      }

      const result = await timelineService.recordEvent(event);

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/timeline/events/batch
   * Record multiple timeline events
   */
  async recordEventsBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const events: TimelineEvent[] = req.body.events;

      if (!Array.isArray(events) || events.length === 0) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'events must be a non-empty array'
        });
        return;
      }

      const results = await timelineService.recordEventsBatch(events);

      res.status(201).json({
        success: true,
        count: results.length,
        data: results
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/timeline/session/:sessionId
   * Get complete timeline for a session
   */
  async getSessionTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;

      const [events, summary] = await Promise.all([
        timelineService.getSessionTimeline(sessionId),
        timelineService.getSessionSummary(sessionId)
      ]);

      if (!summary) {
        res.status(404).json({
          error: 'Session not found'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          session_id: sessionId,
          summary,
          events
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/timeline/session/:sessionId/analytics
   * Get analytics for a session
   */
  async getSessionAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;

      const analytics = await timelineService.getSessionAnalytics(sessionId);

      if (!analytics) {
        res.status(404).json({
          error: 'Session not found'
        });
        return;
      }

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/timeline/query
   * Query timeline events with filters
   */
  async queryTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query: TimelineQuery = req.body;

      const events = await timelineService.queryTimeline(query);

      res.json({
        success: true,
        count: events.length,
        data: events
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/timeline/student/:studentId/progress
   * Get student progress across modules
   */
  async getStudentProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { studentId } = req.params;
      const { module_id } = req.query;

      const progress = await timelineService.getStudentProgress(
        studentId,
        module_id as string | undefined
      );

      res.json({
        success: true,
        data: progress
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/timeline/student/:studentId/sessions
   * Get student sessions with optional filters
   */
  async getStudentSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { studentId } = req.params;
      const { start_date, end_date, module_id } = req.query;

      const startDate = start_date ? new Date(start_date as string) : undefined;
      const endDate = end_date ? new Date(end_date as string) : undefined;

      const sessions = await timelineService.getStudentSessions(
        studentId,
        startDate,
        endDate,
        module_id as string | undefined
      );

      res.json({
        success: true,
        count: sessions.length,
        data: sessions
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/timeline/module/:moduleId/analytics
   * Get module-wide analytics
   */
  async getModuleAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { moduleId } = req.params;

      const analytics = await timelineService.getModuleAnalytics(moduleId);

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new TimelineController();
