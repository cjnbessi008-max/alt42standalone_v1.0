import { Request, Response } from 'express';
import { FocusTrackingService } from '../services/focusTrackingService';
import {
  FocusTrackingEvent,
  FocusStatistics,
  SessionDetails,
  DailyReport,
  ModuleReport,
} from '../types/focusTracking';

/**
 * 집중 추적 컨트롤러
 */
export class FocusTrackingController {
  private service: FocusTrackingService;

  constructor() {
    this.service = new FocusTrackingService();
  }

  /**
   * 집중 추적 이벤트 기록
   */
  async logEvents(req: Request, res: Response): Promise<void> {
    try {
      const { events } = req.body as { events: FocusTrackingEvent[] };

      // 이벤트 저장
      await this.service.saveEvents(events);

      res.status(201).json({
        success: true,
        message: `Successfully logged ${events.length} events`,
        count: events.length,
      });
    } catch (error) {
      console.error('Error in logEvents:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to log events',
      });
    }
  }

  /**
   * 학생의 집중도 통계 조회
   */
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, moduleId } = req.query as {
        studentId: string;
        moduleId: string;
      };

      const statistics = await this.service.getStatistics(studentId, moduleId);

      res.status(200).json(statistics);
    } catch (error) {
      console.error('Error in getStatistics:', error);
      res.status(500).json({
        error: 'Failed to fetch statistics',
      });
    }
  }

  /**
   * 세션 상세 정보 조회
   */
  async getSessionDetails(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      const sessionDetails = await this.service.getSessionDetails(sessionId);

      if (!sessionDetails) {
        res.status(404).json({
          error: 'Session not found',
        });
        return;
      }

      res.status(200).json(sessionDetails);
    } catch (error) {
      console.error('Error in getSessionDetails:', error);
      res.status(500).json({
        error: 'Failed to fetch session details',
      });
    }
  }

  /**
   * 일별 집중도 리포트
   */
  async getDailyReport(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, date } = req.query as {
        studentId: string;
        date: string;
      };

      const report = await this.service.getDailyReport(studentId, new Date(date));

      res.status(200).json(report);
    } catch (error) {
      console.error('Error in getDailyReport:', error);
      res.status(500).json({
        error: 'Failed to fetch daily report',
      });
    }
  }

  /**
   * 모듈별 집중도 리포트
   */
  async getModuleReport(req: Request, res: Response): Promise<void> {
    try {
      const { moduleId } = req.query as { moduleId: string };

      const report = await this.service.getModuleReport(moduleId);

      res.status(200).json(report);
    } catch (error) {
      console.error('Error in getModuleReport:', error);
      res.status(500).json({
        error: 'Failed to fetch module report',
      });
    }
  }
}
