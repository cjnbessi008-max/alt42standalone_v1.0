import { Request, Response, NextFunction } from 'express';
import timelineService from '../services/timeline.service';

export class LMSController {
  /**
   * GET /api/lms/student/:studentId/timeline
   * Get student timeline data formatted for LMS integration
   */
  async getStudentTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { studentId } = req.params;
      const { start_date, end_date, module_id } = req.query;

      const startDate = start_date ? new Date(start_date as string) : undefined;
      const endDate = end_date ? new Date(end_date as string) : undefined;

      // Get sessions and progress
      const [sessions, progress] = await Promise.all([
        timelineService.getStudentSessions(
          studentId,
          startDate,
          endDate,
          module_id as string | undefined
        ),
        timelineService.getStudentProgress(studentId, module_id as string | undefined)
      ]);

      // Calculate analytics
      const totalSessions = sessions.length;
      const totalTime = sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
      const avgDuration = totalSessions > 0 ? Math.round(totalTime / totalSessions) : 0;
      const completedSessions = sessions.filter(s => s.is_completed).length;
      const correctSessions = sessions.filter(s => s.is_correct).length;
      const completionRate = totalSessions > 0
        ? Number((completedSessions / totalSessions).toFixed(2))
        : 0;

      res.json({
        success: true,
        data: {
          student_id: studentId,
          period: {
            start: startDate || sessions[sessions.length - 1]?.started_at,
            end: endDate || sessions[0]?.started_at
          },
          sessions: sessions.map(session => ({
            session_id: session.session_id,
            module_id: session.module_id,
            problem_id: session.problem_id,
            started_at: session.started_at,
            completed_at: session.completed_at,
            duration_seconds: session.duration_seconds,
            events_count: session.total_events,
            outcome: session.is_correct ? 'correct' : session.is_completed ? 'incorrect' : 'incomplete',
            attempts: session.answer_attempts,
            hints_used: session.hints_used,
            timeline_url: `/api/timeline/session/${session.session_id}`
          })),
          analytics: {
            total_sessions: totalSessions,
            total_time_seconds: totalTime,
            average_session_duration: avgDuration,
            completion_rate: completionRate,
            average_attempts: progress[0]?.avg_attempts_per_problem || 0
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/lms/module/:moduleId/analytics
   * Get module analytics formatted for LMS
   */
  async getModuleAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { moduleId } = req.params;

      const analytics = await timelineService.getModuleAnalytics(moduleId);

      res.json({
        success: true,
        data: {
          module_id: moduleId,
          student_analytics: analytics.student_analytics.map(student => ({
            student_id: student.student_id,
            sessions_count: student.total_sessions,
            total_time_seconds: student.total_time_seconds,
            completion_rate: student.completion_rate / 100,
            accuracy_rate: student.accuracy_rate / 100,
            average_attempts: Number(student.avg_attempts_per_problem.toFixed(1)),
            progress_percentage: student.completion_rate
          })),
          module_summary: {
            total_students: analytics.module_summary.total_students,
            average_completion_rate: Number((analytics.module_summary.avg_completion_rate / 100).toFixed(2)),
            average_time_per_problem: Math.round(analytics.module_summary.avg_time_per_problem),
            average_accuracy_rate: Number((analytics.module_summary.avg_accuracy_rate / 100).toFixed(2)),
            common_difficulties: analytics.module_summary.common_difficulties.map((d: any) => ({
              problem_id: d.problem_id,
              failure_rate: Number((d.failure_rate / 100).toFixed(2)),
              average_attempts: Number(d.avg_attempts.toFixed(1)),
              total_attempts: d.total_attempts
            }))
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/lms/xapi/statements
   * Get xAPI statements for LMS integration
   */
  async getXAPIStatements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { student_id, module_id, since, until, limit = 100 } = req.query;

      const conditions: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (student_id) {
        conditions.push(`student_id = $${paramCount++}`);
        values.push(student_id);
      }

      if (module_id) {
        conditions.push(`module_id = $${paramCount++}`);
        values.push(module_id);
      }

      if (since) {
        conditions.push(`timestamp >= $${paramCount++}`);
        values.push(new Date(since as string));
      }

      if (until) {
        conditions.push(`timestamp <= $${paramCount++}`);
        values.push(new Date(until as string));
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const query = `
        SELECT
          statement_id,
          actor,
          verb,
          object,
          result,
          context,
          timestamp,
          authority,
          version
        FROM xapi_statements
        ${whereClause}
        ORDER BY timestamp DESC
        LIMIT $${paramCount};
      `;

      values.push(parseInt(limit as string));

      const { pool } = require('../config/database');
      const result = await pool.query(query, values);

      res.json({
        statements: result.rows
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/lms/export
   * Export student data for LMS
   */
  async exportData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { student_id, module_id, export_type = 'timeline', format = 'json' } = req.body;

      if (!student_id || !module_id) {
        res.status(400).json({
          error: 'Missing required fields',
          required: ['student_id', 'module_id']
        });
        return;
      }

      // Get comprehensive student data
      const [sessions, progress, timeline] = await Promise.all([
        timelineService.getStudentSessions(student_id, undefined, undefined, module_id),
        timelineService.getStudentProgress(student_id, module_id),
        export_type === 'timeline' && sessions.length > 0
          ? timelineService.getSessionTimeline(sessions[0].session_id)
          : Promise.resolve([])
      ]);

      const exportData = {
        export_metadata: {
          student_id,
          module_id,
          export_type,
          format,
          exported_at: new Date().toISOString(),
          version: '1.0.0'
        },
        student_progress: progress[0] || null,
        sessions: sessions,
        timeline_sample: timeline.slice(0, 100) // First 100 events as sample
      };

      if (format === 'csv') {
        // Convert to CSV (simplified)
        const csv = this.convertToCSV(exportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="export_${student_id}_${module_id}.csv"`);
        res.send(csv);
      } else {
        // Return as JSON
        res.json({
          success: true,
          data: exportData
        });
      }
    } catch (error) {
      next(error);
    }
  }

  private convertToCSV(data: any): string {
    // Simplified CSV conversion - would need proper implementation
    const sessions = data.sessions || [];
    const headers = 'session_id,started_at,completed_at,duration_seconds,is_completed,is_correct,answer_attempts,hints_used\n';
    const rows = sessions.map((s: any) =>
      `${s.session_id},${s.started_at},${s.completed_at || ''},${s.duration_seconds || ''},${s.is_completed},${s.is_correct || ''},${s.answer_attempts},${s.hints_used}`
    ).join('\n');
    return headers + rows;
  }
}

export default new LMSController();
