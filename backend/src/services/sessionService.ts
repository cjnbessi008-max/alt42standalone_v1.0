import { query } from '../config/database';
import { LearningSession, CreateSessionRequest, EndSessionRequest } from '../models/types';
import logger from '../utils/logger';

export class SessionService {
  async createSession(data: CreateSessionRequest): Promise<LearningSession> {
    try {
      const result = await query(
        `INSERT INTO learning_sessions (student_id, course_id, course_name, started_at, activity_type)
         VALUES ($1, $2, $3, NOW(), $4)
         RETURNING *`,
        [data.student_id, data.course_id, data.course_name, data.activity_type || null]
      );
      logger.info(`Learning session created for student ${data.student_id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating learning session:', error);
      throw error;
    }
  }

  async endSession(sessionId: string, data?: EndSessionRequest): Promise<LearningSession> {
    try {
      const endedAt = data?.ended_at || new Date();
      const result = await query(
        `UPDATE learning_sessions
         SET ended_at = $1
         WHERE id = $2
         RETURNING *`,
        [endedAt, sessionId]
      );

      if (result.rows.length === 0) {
        throw new Error('Session not found');
      }

      logger.info(`Learning session ${sessionId} ended`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error ending learning session:', error);
      throw error;
    }
  }

  async getSessionById(sessionId: string): Promise<LearningSession | null> {
    try {
      const result = await query(
        'SELECT * FROM learning_sessions WHERE id = $1',
        [sessionId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error fetching session by ID:', error);
      throw error;
    }
  }

  async getSessionsByStudent(studentId: string, limit: number = 50): Promise<LearningSession[]> {
    try {
      const result = await query(
        `SELECT * FROM learning_sessions
         WHERE student_id = $1
         ORDER BY started_at DESC
         LIMIT $2`,
        [studentId, limit]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error fetching student sessions:', error);
      throw error;
    }
  }

  async getActiveSessions(studentId: string): Promise<LearningSession[]> {
    try {
      const result = await query(
        `SELECT * FROM learning_sessions
         WHERE student_id = $1
         AND ended_at IS NULL
         ORDER BY started_at DESC`,
        [studentId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error fetching active sessions:', error);
      throw error;
    }
  }

  async getSessionStats(studentId: string, days: number = 7): Promise<any> {
    try {
      const result = await query(
        `SELECT
          COUNT(*) as total_sessions,
          SUM(duration_minutes) as total_minutes,
          AVG(duration_minutes) as avg_duration,
          MAX(duration_minutes) as max_duration
         FROM learning_sessions
         WHERE student_id = $1
         AND started_at >= NOW() - INTERVAL '${days} days'`,
        [studentId]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching session stats:', error);
      throw error;
    }
  }
}

export default new SessionService();
