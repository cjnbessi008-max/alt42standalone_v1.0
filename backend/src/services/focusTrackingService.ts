import { Pool } from 'pg';
import {
  FocusTrackingEvent,
  FocusStatistics,
  SessionDetails,
  DailyReport,
  ModuleReport,
} from '../types/focusTracking';

/**
 * 집중 추적 서비스
 *
 * PostgreSQL을 사용하여 집중 추적 데이터를 저장하고 분석합니다.
 */
export class FocusTrackingService {
  private db: Pool;

  constructor() {
    // PostgreSQL 연결 (환경변수에서 설정 가져오기)
    this.db = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'ai_education',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });
  }

  /**
   * 이벤트 저장
   */
  async saveEvents(events: FocusTrackingEvent[]): Promise<void> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      const insertQuery = `
        INSERT INTO focus_tracking_events (
          event_type,
          timestamp,
          student_id,
          module_id,
          session_id,
          metadata
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `;

      for (const event of events) {
        await client.query(insertQuery, [
          event.eventType,
          new Date(event.timestamp),
          event.studentId,
          event.moduleId,
          event.sessionId,
          JSON.stringify(event.metadata || {}),
        ]);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error saving focus tracking events:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 통계 조회
   */
  async getStatistics(
    studentId: string,
    moduleId: string
  ): Promise<FocusStatistics> {
    const query = `
      WITH session_stats AS (
        SELECT
          session_id,
          MIN(timestamp) AS session_start,
          MAX(timestamp) AS session_end,
          SUM(CASE WHEN event_type = 'focus_lost' THEN 1 ELSE 0 END) AS focus_lost_count,
          SUM(CASE WHEN event_type = 'break_completed' THEN 1 ELSE 0 END) AS breaks_completed,
          SUM(CASE WHEN event_type = 'break_skipped' THEN 1 ELSE 0 END) AS breaks_skipped,
          AVG(
            CASE WHEN event_type IN ('break_completed', 'break_skipped')
            THEN (metadata->>'breakDuration')::numeric
            ELSE NULL END
          ) AS avg_break_duration
        FROM focus_tracking_events
        WHERE student_id = $1 AND module_id = $2
        GROUP BY session_id
      ),
      idle_stats AS (
        SELECT
          SUM((metadata->>'idleTime')::numeric) AS total_idle_time
        FROM focus_tracking_events
        WHERE student_id = $1
          AND module_id = $2
          AND event_type = 'idle_detected'
          AND metadata->>'idleTime' IS NOT NULL
      )
      SELECT
        $1 AS student_id,
        $2 AS module_id,
        COALESCE(SUM(EXTRACT(EPOCH FROM (session_end - session_start))), 0) AS total_focus_time,
        COALESCE((SELECT total_idle_time FROM idle_stats), 0) AS total_idle_time,
        COALESCE(SUM(focus_lost_count), 0) AS focus_lost_count,
        COALESCE(SUM(breaks_completed), 0) AS breaks_completed,
        COALESCE(SUM(breaks_skipped), 0) AS breaks_skipped,
        COALESCE(AVG(avg_break_duration), 0) AS average_break_duration,
        COALESCE(MAX(session_end), NOW()) AS last_activity_timestamp
      FROM session_stats
    `;

    const result = await this.db.query(query, [studentId, moduleId]);

    if (result.rows.length === 0) {
      return {
        studentId,
        moduleId,
        sessionId: '',
        totalFocusTime: 0,
        totalIdleTime: 0,
        focusLostCount: 0,
        breaksCompleted: 0,
        breaksSkipped: 0,
        averageBreakDuration: 0,
        lastActivityTimestamp: Date.now(),
      };
    }

    const row = result.rows[0];
    return {
      studentId: row.student_id,
      moduleId: row.module_id,
      sessionId: '',
      totalFocusTime: parseFloat(row.total_focus_time || 0),
      totalIdleTime: parseFloat(row.total_idle_time || 0),
      focusLostCount: parseInt(row.focus_lost_count || 0),
      breaksCompleted: parseInt(row.breaks_completed || 0),
      breaksSkipped: parseInt(row.breaks_skipped || 0),
      averageBreakDuration: parseFloat(row.average_break_duration || 0),
      lastActivityTimestamp: new Date(row.last_activity_timestamp).getTime(),
    };
  }

  /**
   * 세션 상세 정보 조회
   */
  async getSessionDetails(sessionId: string): Promise<SessionDetails | null> {
    const query = `
      SELECT
        session_id,
        student_id,
        module_id,
        MIN(timestamp) AS started_at,
        MAX(timestamp) AS ended_at,
        jsonb_agg(
          jsonb_build_object(
            'eventType', event_type,
            'timestamp', timestamp,
            'metadata', metadata
          )
          ORDER BY timestamp
        ) AS events
      FROM focus_tracking_events
      WHERE session_id = $1
      GROUP BY session_id, student_id, module_id
    `;

    const result = await this.db.query(query, [sessionId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      sessionId: row.session_id,
      studentId: row.student_id,
      moduleId: row.module_id,
      startedAt: new Date(row.started_at).getTime(),
      endedAt: new Date(row.ended_at).getTime(),
      events: row.events,
    };
  }

  /**
   * 일별 리포트
   */
  async getDailyReport(studentId: string, date: Date): Promise<DailyReport> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const query = `
      WITH daily_events AS (
        SELECT *
        FROM focus_tracking_events
        WHERE student_id = $1
          AND timestamp >= $2
          AND timestamp <= $3
      )
      SELECT
        $1 AS student_id,
        $2 AS date,
        COUNT(DISTINCT session_id) AS total_sessions,
        COUNT(CASE WHEN event_type = 'focus_lost' THEN 1 END) AS focus_lost_count,
        COUNT(CASE WHEN event_type = 'break_completed' THEN 1 END) AS breaks_completed,
        COUNT(CASE WHEN event_type = 'break_skipped' THEN 1 END) AS breaks_skipped,
        COALESCE(AVG(
          CASE WHEN event_type IN ('break_completed', 'break_skipped')
          THEN (metadata->>'breakDuration')::numeric
          END
        ), 0) AS avg_break_duration
      FROM daily_events
    `;

    const result = await this.db.query(query, [
      studentId,
      startOfDay,
      endOfDay,
    ]);

    const row = result.rows[0];
    return {
      studentId: row.student_id,
      date: startOfDay.toISOString(),
      totalSessions: parseInt(row.total_sessions || 0),
      focusLostCount: parseInt(row.focus_lost_count || 0),
      breaksCompleted: parseInt(row.breaks_completed || 0),
      breaksSkipped: parseInt(row.breaks_skipped || 0),
      averageBreakDuration: parseFloat(row.avg_break_duration || 0),
    };
  }

  /**
   * 모듈별 리포트
   */
  async getModuleReport(moduleId: string): Promise<ModuleReport> {
    const query = `
      SELECT
        module_id,
        COUNT(DISTINCT student_id) AS total_students,
        COUNT(DISTINCT session_id) AS total_sessions,
        AVG(
          CASE WHEN event_type = 'focus_lost' THEN 1 ELSE 0 END
        ) AS avg_focus_lost_per_session,
        AVG(
          CASE WHEN event_type = 'break_completed' THEN 1 ELSE 0 END
        ) AS avg_breaks_completed_per_session,
        STDDEV(
          CASE WHEN event_type = 'focus_lost' THEN 1 ELSE 0 END
        ) AS focus_lost_stddev
      FROM focus_tracking_events
      WHERE module_id = $1
      GROUP BY module_id
    `;

    const result = await this.db.query(query, [moduleId]);

    if (result.rows.length === 0) {
      return {
        moduleId,
        totalStudents: 0,
        totalSessions: 0,
        averageFocusLostPerSession: 0,
        averageBreaksCompletedPerSession: 0,
        focusLostStandardDeviation: 0,
      };
    }

    const row = result.rows[0];
    return {
      moduleId: row.module_id,
      totalStudents: parseInt(row.total_students || 0),
      totalSessions: parseInt(row.total_sessions || 0),
      averageFocusLostPerSession: parseFloat(row.avg_focus_lost_per_session || 0),
      averageBreaksCompletedPerSession: parseFloat(
        row.avg_breaks_completed_per_session || 0
      ),
      focusLostStandardDeviation: parseFloat(row.focus_lost_stddev || 0),
    };
  }
}
