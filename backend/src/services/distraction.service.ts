/**
 * Distraction Detection Service
 *
 * Business logic for distraction detection, marking, and analytics
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

interface DistractionEvent {
  id?: string;
  studentId: string;
  moduleId: string;
  problemId?: string;
  sessionId: string;
  eventType: string;
  severityLevel: string;
  durationSeconds: number;
  metadata?: Record<string, any>;
  problemContext?: Record<string, any>;
  eventTimestamp?: Date;
}

interface DistractionMark {
  id?: string;
  distractionEventId: string;
  studentId: string;
  moduleId: string;
  problemId?: string;
  category: string;
  severity: string;
  contextNotes?: string;
  rootCauseAnalysis?: string;
  actionTaken?: string;
  interventionRecommended?: boolean;
  interventionType?: string;
  markedByUserId: string;
}

interface EventFilters {
  moduleId: string;
  studentId?: string;
  sessionId?: string;
  eventType?: string;
  startDate?: string;
  endDate?: string;
  unmarkedOnly?: boolean;
  limit: number;
  offset: number;
}

interface MarkFilters {
  moduleId: string;
  studentId?: string;
  category?: string;
  severity?: string;
  startDate?: string;
  endDate?: string;
  limit: number;
  offset: number;
}

export class DistractionService {
  private db: Pool;

  constructor() {
    // Database connection pool
    this.db = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'ai_education',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  // ============================================================================
  // Event Management
  // ============================================================================

  /**
   * Create a single distraction event
   */
  async createEvent(eventData: DistractionEvent): Promise<DistractionEvent> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      // Determine severity level if not provided
      const severityLevel = eventData.severityLevel || this.determineSeverity(eventData.durationSeconds);

      const query = `
        INSERT INTO distraction_events (
          id, student_id, module_id, problem_id, session_id,
          event_type, severity_level, duration_seconds,
          metadata, problem_context, event_timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const values = [
        uuidv4(),
        eventData.studentId,
        eventData.moduleId,
        eventData.problemId || null,
        eventData.sessionId,
        eventData.eventType,
        severityLevel,
        eventData.durationSeconds,
        JSON.stringify(eventData.metadata || {}),
        JSON.stringify(eventData.problemContext || {}),
        eventData.eventTimestamp || new Date(),
      ];

      const result = await client.query(query, values);

      // Update or create session aggregate
      await this.updateSessionAggregate(client, eventData.sessionId);

      // Check thresholds and trigger interventions if needed
      await this.checkThresholdsAndTriggerInterventions(client, eventData);

      await client.query('COMMIT');

      return this.mapDbRowToEvent(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create multiple distraction events in batch
   */
  async createEventsBatch(events: DistractionEvent[]): Promise<DistractionEvent[]> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      const createdEvents: DistractionEvent[] = [];

      for (const eventData of events) {
        const severityLevel = eventData.severityLevel || this.determineSeverity(eventData.durationSeconds);

        const query = `
          INSERT INTO distraction_events (
            id, student_id, module_id, problem_id, session_id,
            event_type, severity_level, duration_seconds,
            metadata, problem_context, event_timestamp
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *
        `;

        const values = [
          uuidv4(),
          eventData.studentId,
          eventData.moduleId,
          eventData.problemId || null,
          eventData.sessionId,
          eventData.eventType,
          severityLevel,
          eventData.durationSeconds,
          JSON.stringify(eventData.metadata || {}),
          JSON.stringify(eventData.problemContext || {}),
          eventData.eventTimestamp || new Date(),
        ];

        const result = await client.query(query, values);
        createdEvents.push(this.mapDbRowToEvent(result.rows[0]));
      }

      // Update session aggregates for all unique sessions
      const uniqueSessions = [...new Set(events.map((e) => e.sessionId))];
      for (const sessionId of uniqueSessions) {
        await this.updateSessionAggregate(client, sessionId);
      }

      await client.query('COMMIT');

      return createdEvents;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get distraction events with filtering
   */
  async getEvents(filters: EventFilters): Promise<{ events: DistractionEvent[]; total: number }> {
    let query = `
      SELECT de.*,
             s.email as student_email,
             m.name as module_name,
             dm.id as mark_id
      FROM distraction_events de
      JOIN students s ON de.student_id = s.id
      JOIN modules m ON de.module_id = m.id
      LEFT JOIN distraction_marks dm ON de.id = dm.distraction_event_id
      WHERE de.module_id = $1
    `;

    const params: any[] = [filters.moduleId];
    let paramIndex = 2;

    if (filters.studentId) {
      query += ` AND de.student_id = $${paramIndex}`;
      params.push(filters.studentId);
      paramIndex++;
    }

    if (filters.sessionId) {
      query += ` AND de.session_id = $${paramIndex}`;
      params.push(filters.sessionId);
      paramIndex++;
    }

    if (filters.eventType) {
      query += ` AND de.event_type = $${paramIndex}`;
      params.push(filters.eventType);
      paramIndex++;
    }

    if (filters.startDate) {
      query += ` AND de.event_timestamp >= $${paramIndex}`;
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters.endDate) {
      query += ` AND de.event_timestamp <= $${paramIndex}`;
      params.push(filters.endDate);
      paramIndex++;
    }

    if (filters.unmarkedOnly) {
      query += ` AND dm.id IS NULL`;
    }

    // Count total
    const countQuery = query.replace('SELECT de.*,', 'SELECT COUNT(*) as total FROM (SELECT de.id,');
    const countResult = await this.db.query(countQuery + ') as count_subquery', params);
    const total = parseInt(countResult.rows[0]?.total || '0');

    // Add pagination
    query += ` ORDER BY de.event_timestamp DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(filters.limit, filters.offset);

    const result = await this.db.query(query, params);

    return {
      events: result.rows.map(this.mapDbRowToEvent),
      total,
    };
  }

  // ============================================================================
  // Mark Management
  // ============================================================================

  /**
   * Create a distraction mark
   */
  async createMark(markData: DistractionMark): Promise<DistractionMark> {
    const query = `
      INSERT INTO distraction_marks (
        id, distraction_event_id, student_id, module_id, problem_id,
        category, severity, context_notes, root_cause_analysis,
        action_taken, intervention_recommended, intervention_type,
        marked_by_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      uuidv4(),
      markData.distractionEventId,
      markData.studentId,
      markData.moduleId,
      markData.problemId || null,
      markData.category,
      markData.severity,
      markData.contextNotes || null,
      markData.rootCauseAnalysis || null,
      markData.actionTaken || null,
      markData.interventionRecommended || false,
      markData.interventionType || null,
      markData.markedByUserId,
    ];

    const result = await this.db.query(query, values);

    return this.mapDbRowToMark(result.rows[0]);
  }

  /**
   * Get distraction marks with filtering
   */
  async getMarks(filters: MarkFilters): Promise<{ marks: DistractionMark[]; total: number }> {
    let query = `
      SELECT dm.*,
             de.event_type,
             de.duration_seconds,
             de.event_timestamp,
             s.email as student_email,
             m.name as module_name,
             t.email as teacher_email
      FROM distraction_marks dm
      JOIN distraction_events de ON dm.distraction_event_id = de.id
      JOIN students s ON dm.student_id = s.id
      JOIN modules m ON dm.module_id = m.id
      JOIN teachers t ON dm.marked_by_user_id = t.id
      WHERE dm.module_id = $1
    `;

    const params: any[] = [filters.moduleId];
    let paramIndex = 2;

    if (filters.studentId) {
      query += ` AND dm.student_id = $${paramIndex}`;
      params.push(filters.studentId);
      paramIndex++;
    }

    if (filters.category) {
      query += ` AND dm.category = $${paramIndex}`;
      params.push(filters.category);
      paramIndex++;
    }

    if (filters.severity) {
      query += ` AND dm.severity = $${paramIndex}`;
      params.push(filters.severity);
      paramIndex++;
    }

    if (filters.startDate) {
      query += ` AND dm.marked_at >= $${paramIndex}`;
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters.endDate) {
      query += ` AND dm.marked_at <= $${paramIndex}`;
      params.push(filters.endDate);
      paramIndex++;
    }

    // Count total
    const countQuery = query.replace('SELECT dm.*,', 'SELECT COUNT(*) as total FROM (SELECT dm.id,');
    const countResult = await this.db.query(countQuery + ') as count_subquery', params);
    const total = parseInt(countResult.rows[0]?.total || '0');

    // Add pagination
    query += ` ORDER BY dm.marked_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(filters.limit, filters.offset);

    const result = await this.db.query(query, params);

    return {
      marks: result.rows.map(this.mapDbRowToMark),
      total,
    };
  }

  /**
   * Update a distraction mark
   */
  async updateMark(markId: string, updateData: Partial<DistractionMark>): Promise<DistractionMark> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateData.category) {
      fields.push(`category = $${paramIndex++}`);
      values.push(updateData.category);
    }

    if (updateData.severity) {
      fields.push(`severity = $${paramIndex++}`);
      values.push(updateData.severity);
    }

    if (updateData.contextNotes !== undefined) {
      fields.push(`context_notes = $${paramIndex++}`);
      values.push(updateData.contextNotes);
    }

    if (updateData.rootCauseAnalysis !== undefined) {
      fields.push(`root_cause_analysis = $${paramIndex++}`);
      values.push(updateData.rootCauseAnalysis);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(markId);

    const query = `
      UPDATE distraction_marks
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.db.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('Mark not found');
    }

    return this.mapDbRowToMark(result.rows[0]);
  }

  // ============================================================================
  // Analytics
  // ============================================================================

  /**
   * Get student distraction summary
   */
  async getStudentSummary(moduleId: string, studentId: string): Promise<any> {
    const query = `
      SELECT
        student_id,
        module_id,
        COUNT(DISTINCT session_id) as total_sessions,
        ROUND(AVG(distraction_percentage), 2) as avg_distraction_percentage,
        SUM(total_events) as total_distraction_events,
        SUM(total_distraction_duration_seconds) as total_distraction_duration,
        MAX(session_start) as last_session_date,
        ROUND(AVG(longest_focus_duration_seconds), 2) as avg_longest_focus,
        COUNT(*) FILTER (WHERE flagged_for_intervention) as flagged_sessions_count
      FROM distraction_sessions
      WHERE module_id = $1 AND student_id = $2
      GROUP BY student_id, module_id
    `;

    const result = await this.db.query(query, [moduleId, studentId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Get module analytics
   */
  async getModuleAnalytics(moduleId: string, options: any): Promise<any> {
    const query = `
      SELECT
        date,
        SUM(sessions_count) as total_sessions,
        ROUND(AVG(average_distraction_percentage), 2) as avg_distraction_percentage,
        SUM(total_distraction_events) as total_events,
        SUM(total_distraction_duration_seconds) as total_duration,
        jsonb_object_agg(
          coalesce(event_type_breakdown::text, '{}'),
          event_type_breakdown
        ) as event_breakdown
      FROM daily_distraction_analytics
      WHERE module_id = $1
        AND date >= COALESCE($2::date, date - INTERVAL '30 days')
        AND date <= COALESCE($3::date, CURRENT_DATE)
      GROUP BY date
      ORDER BY date DESC
    `;

    const result = await this.db.query(query, [
      moduleId,
      options.startDate || null,
      options.endDate || null,
    ]);

    return result.rows;
  }

  // ============================================================================
  // Threshold Management
  // ============================================================================

  /**
   * Get distraction thresholds for a module
   */
  async getThresholds(moduleId: string): Promise<any> {
    const query = `
      SELECT * FROM distraction_thresholds
      WHERE module_id = $1
    `;

    const result = await this.db.query(query, [moduleId]);

    if (result.rows.length === 0) {
      // Return default thresholds
      return {
        moduleId,
        criticalPercentage: 50,
        warningPercentage: 30,
        minorPercentage: 10,
        autoPauseOnCritical: false,
        sendTeacherAlerts: true,
        sendStudentReminders: true,
      };
    }

    return result.rows[0];
  }

  /**
   * Update distraction thresholds
   */
  async updateThresholds(moduleId: string, teacherId: string, thresholdData: any): Promise<any> {
    const query = `
      INSERT INTO distraction_thresholds (
        id, module_id, teacher_id,
        critical_percentage, warning_percentage, minor_percentage,
        auto_pause_on_critical, send_teacher_alerts, send_student_reminders
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (module_id)
      DO UPDATE SET
        critical_percentage = EXCLUDED.critical_percentage,
        warning_percentage = EXCLUDED.warning_percentage,
        minor_percentage = EXCLUDED.minor_percentage,
        auto_pause_on_critical = EXCLUDED.auto_pause_on_critical,
        send_teacher_alerts = EXCLUDED.send_teacher_alerts,
        send_student_reminders = EXCLUDED.send_student_reminders,
        updated_at = NOW()
      RETURNING *
    `;

    const values = [
      uuidv4(),
      moduleId,
      teacherId,
      thresholdData.criticalPercentage ?? 50,
      thresholdData.warningPercentage ?? 30,
      thresholdData.minorPercentage ?? 10,
      thresholdData.autoPauseOnCritical ?? false,
      thresholdData.sendTeacherAlerts ?? true,
      thresholdData.sendStudentReminders ?? true,
    ];

    const result = await this.db.query(query, values);

    return result.rows[0];
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private determineSeverity(durationSeconds: number): string {
    if (durationSeconds < 10) return 'minor';
    if (durationSeconds < 30) return 'moderate';
    if (durationSeconds < 60) return 'major';
    return 'critical';
  }

  private async updateSessionAggregate(client: any, sessionId: string): Promise<void> {
    // This function is called by the database trigger,
    // but we can also call it manually if needed
    await client.query('SELECT update_session_aggregates($1)', [sessionId]);
  }

  private async checkThresholdsAndTriggerInterventions(
    client: any,
    eventData: DistractionEvent
  ): Promise<void> {
    // Get thresholds for the module
    const thresholdQuery = `
      SELECT * FROM distraction_thresholds
      WHERE module_id = $1
    `;

    const thresholdResult = await client.query(thresholdQuery, [eventData.moduleId]);

    if (thresholdResult.rows.length === 0) {
      return; // No thresholds configured
    }

    const thresholds = thresholdResult.rows[0];

    // Get current session distraction percentage
    const sessionQuery = `
      SELECT distraction_percentage
      FROM distraction_sessions
      WHERE session_id = $1
    `;

    const sessionResult = await client.query(sessionQuery, [eventData.sessionId]);

    if (sessionResult.rows.length === 0) {
      return;
    }

    const session = sessionResult.rows[0];
    const distractionPercentage = parseFloat(session.distraction_percentage);

    // Check if intervention is needed
    let interventionType: string | null = null;

    if (distractionPercentage >= thresholds.critical_percentage) {
      interventionType = thresholds.auto_pause_on_critical ? 'auto_pause' : 'alert_notification';
    } else if (distractionPercentage >= thresholds.warning_percentage) {
      interventionType = 'focus_reminder';
    }

    if (interventionType) {
      // Create intervention record
      await client.query(
        `
        INSERT INTO distraction_interventions (
          id, student_id, module_id, session_id, distraction_event_id,
          intervention_type, trigger_reason
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
        [
          uuidv4(),
          eventData.studentId,
          eventData.moduleId,
          eventData.sessionId,
          eventData.id,
          interventionType,
          `Distraction percentage ${distractionPercentage.toFixed(2)}% exceeded threshold`,
        ]
      );
    }
  }

  private mapDbRowToEvent(row: any): DistractionEvent {
    return {
      id: row.id,
      studentId: row.student_id,
      moduleId: row.module_id,
      problemId: row.problem_id,
      sessionId: row.session_id,
      eventType: row.event_type,
      severityLevel: row.severity_level,
      durationSeconds: row.duration_seconds,
      metadata: row.metadata,
      problemContext: row.problem_context,
      eventTimestamp: row.event_timestamp,
    };
  }

  private mapDbRowToMark(row: any): DistractionMark {
    return {
      id: row.id,
      distractionEventId: row.distraction_event_id,
      studentId: row.student_id,
      moduleId: row.module_id,
      problemId: row.problem_id,
      category: row.category,
      severity: row.severity,
      contextNotes: row.context_notes,
      rootCauseAnalysis: row.root_cause_analysis,
      actionTaken: row.action_taken,
      interventionRecommended: row.intervention_recommended,
      interventionType: row.intervention_type,
      markedByUserId: row.marked_by_user_id,
    };
  }
}
