import { pool } from '../config/database';
import {
  TimelineEvent,
  SessionSummary,
  SessionAnalytics,
  TimelineQuery,
  StudentProgress
} from '../models/timeline.model';

export class TimelineService {
  /**
   * Record a timeline event
   */
  async recordEvent(event: TimelineEvent): Promise<TimelineEvent> {
    const query = `
      INSERT INTO solution_timelines (
        student_id, module_id, problem_id, session_id,
        event_type, event_data, sequence_number, client_timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

    const values = [
      event.student_id,
      event.module_id,
      event.problem_id,
      event.session_id,
      event.event_type,
      JSON.stringify(event.event_data),
      event.sequence_number,
      event.client_timestamp || new Date()
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Record multiple events in batch
   */
  async recordEventsBatch(events: TimelineEvent[]): Promise<TimelineEvent[]> {
    if (events.length === 0) return [];

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const insertedEvents: TimelineEvent[] = [];

      for (const event of events) {
        const query = `
          INSERT INTO solution_timelines (
            student_id, module_id, problem_id, session_id,
            event_type, event_data, sequence_number, client_timestamp
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *;
        `;

        const values = [
          event.student_id,
          event.module_id,
          event.problem_id,
          event.session_id,
          event.event_type,
          JSON.stringify(event.event_data),
          event.sequence_number,
          event.client_timestamp || new Date()
        ];

        const result = await client.query(query, values);
        insertedEvents.push(result.rows[0]);
      }

      await client.query('COMMIT');
      return insertedEvents;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get timeline events for a session
   */
  async getSessionTimeline(sessionId: string): Promise<TimelineEvent[]> {
    const query = `
      SELECT * FROM solution_timelines
      WHERE session_id = $1
      ORDER BY sequence_number ASC;
    `;

    const result = await pool.query(query, [sessionId]);
    return result.rows;
  }

  /**
   * Get session summary
   */
  async getSessionSummary(sessionId: string): Promise<SessionSummary | null> {
    const query = `
      SELECT * FROM session_summaries
      WHERE session_id = $1;
    `;

    const result = await pool.query(query, [sessionId]);
    return result.rows[0] || null;
  }

  /**
   * Get session analytics
   */
  async getSessionAnalytics(sessionId: string): Promise<SessionAnalytics | null> {
    const query = `
      SELECT * FROM session_analytics
      WHERE session_id = $1;
    `;

    const result = await pool.query(query, [sessionId]);
    return result.rows[0] || null;
  }

  /**
   * Query timeline events with filters
   */
  async queryTimeline(query: TimelineQuery): Promise<TimelineEvent[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (query.student_id) {
      conditions.push(`student_id = $${paramCount++}`);
      values.push(query.student_id);
    }

    if (query.module_id) {
      conditions.push(`module_id = $${paramCount++}`);
      values.push(query.module_id);
    }

    if (query.problem_id) {
      conditions.push(`problem_id = $${paramCount++}`);
      values.push(query.problem_id);
    }

    if (query.session_id) {
      conditions.push(`session_id = $${paramCount++}`);
      values.push(query.session_id);
    }

    if (query.start_date) {
      conditions.push(`timestamp >= $${paramCount++}`);
      values.push(query.start_date);
    }

    if (query.end_date) {
      conditions.push(`timestamp <= $${paramCount++}`);
      values.push(query.end_date);
    }

    if (query.event_types && query.event_types.length > 0) {
      conditions.push(`event_type = ANY($${paramCount++})`);
      values.push(query.event_types);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = query.limit || 1000;
    const offset = query.offset || 0;

    const sqlQuery = `
      SELECT * FROM solution_timelines
      ${whereClause}
      ORDER BY timestamp DESC, sequence_number DESC
      LIMIT $${paramCount++} OFFSET $${paramCount++};
    `;

    values.push(limit, offset);

    const result = await pool.query(sqlQuery, values);
    return result.rows;
  }

  /**
   * Get student progress for a module
   */
  async getStudentProgress(
    studentId: string,
    moduleId?: string
  ): Promise<StudentProgress[]> {
    const query = `
      SELECT * FROM lms_student_progress
      WHERE student_id = $1
      ${moduleId ? 'AND module_id = $2' : ''}
      ORDER BY last_session_at DESC;
    `;

    const values = moduleId ? [studentId, moduleId] : [studentId];
    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Get student sessions within a date range
   */
  async getStudentSessions(
    studentId: string,
    startDate?: Date,
    endDate?: Date,
    moduleId?: string
  ): Promise<SessionSummary[]> {
    const conditions: string[] = ['student_id = $1'];
    const values: any[] = [studentId];
    let paramCount = 2;

    if (startDate) {
      conditions.push(`started_at >= $${paramCount++}`);
      values.push(startDate);
    }

    if (endDate) {
      conditions.push(`started_at <= $${paramCount++}`);
      values.push(endDate);
    }

    if (moduleId) {
      conditions.push(`module_id = $${paramCount++}`);
      values.push(moduleId);
    }

    const query = `
      SELECT * FROM session_summaries
      WHERE ${conditions.join(' AND ')}
      ORDER BY started_at DESC;
    `;

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Get module analytics
   */
  async getModuleAnalytics(moduleId: string): Promise<{
    module_id: string;
    student_analytics: StudentProgress[];
    module_summary: any;
  }> {
    // Get all student progress for this module
    const progressQuery = `
      SELECT * FROM lms_student_progress
      WHERE module_id = $1
      ORDER BY completion_rate DESC;
    `;

    const progressResult = await pool.query(progressQuery, [moduleId]);
    const studentAnalytics = progressResult.rows;

    // Calculate module-wide statistics
    const summaryQuery = `
      SELECT
        COUNT(DISTINCT student_id) as total_students,
        AVG(completion_rate) as avg_completion_rate,
        AVG(avg_session_duration) as avg_time_per_problem,
        AVG(accuracy_rate) as avg_accuracy_rate
      FROM lms_student_progress
      WHERE module_id = $1;
    `;

    const summaryResult = await pool.query(summaryQuery, [moduleId]);
    const moduleSummary = summaryResult.rows[0];

    // Get common difficulties (problems with high failure rates)
    const difficultiesQuery = `
      SELECT
        problem_id,
        COUNT(*) as total_attempts,
        SUM(CASE WHEN is_correct = FALSE THEN 1 ELSE 0 END) as failures,
        ROUND(
          (SUM(CASE WHEN is_correct = FALSE THEN 1 ELSE 0 END)::NUMERIC /
           NULLIF(COUNT(*), 0)) * 100,
          2
        ) as failure_rate,
        AVG(answer_attempts) as avg_attempts
      FROM session_summaries
      WHERE module_id = $1 AND is_completed = TRUE
      GROUP BY problem_id
      HAVING COUNT(*) >= 5
      ORDER BY failure_rate DESC
      LIMIT 10;
    `;

    const difficultiesResult = await pool.query(difficultiesQuery, [moduleId]);

    return {
      module_id: moduleId,
      student_analytics: studentAnalytics,
      module_summary: {
        ...moduleSummary,
        common_difficulties: difficultiesResult.rows
      }
    };
  }

  /**
   * Delete old timeline events (for data retention)
   */
  async deleteOldEvents(beforeDate: Date): Promise<number> {
    const query = `
      DELETE FROM solution_timelines
      WHERE timestamp < $1;
    `;

    const result = await pool.query(query, [beforeDate]);
    return result.rowCount || 0;
  }
}

export default new TimelineService();
