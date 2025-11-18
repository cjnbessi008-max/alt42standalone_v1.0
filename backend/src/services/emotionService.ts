import { query } from '../config/database';
import {
  EmotionRecord,
  CreateEmotionRequest,
  EmotionType,
  EmotionTrend,
} from '../models/types';
import logger from '../utils/logger';

export class EmotionService {
  async createEmotion(data: CreateEmotionRequest): Promise<EmotionRecord> {
    try {
      const result = await query(
        `INSERT INTO emotion_records (student_id, session_id, emotion_type, intensity, note, context)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          data.student_id,
          data.session_id || null,
          data.emotion_type,
          data.intensity,
          data.note || null,
          data.context ? JSON.stringify(data.context) : null,
        ]
      );
      logger.info(`Emotion record created for student ${data.student_id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating emotion record:', error);
      throw error;
    }
  }

  async getEmotionsByStudent(studentId: string, limit: number = 50): Promise<EmotionRecord[]> {
    try {
      const result = await query(
        `SELECT * FROM emotion_records
         WHERE student_id = $1
         ORDER BY recorded_at DESC
         LIMIT $2`,
        [studentId, limit]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error fetching student emotions:', error);
      throw error;
    }
  }

  async getEmotionsBySession(sessionId: string): Promise<EmotionRecord[]> {
    try {
      const result = await query(
        `SELECT * FROM emotion_records
         WHERE session_id = $1
         ORDER BY recorded_at ASC`,
        [sessionId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error fetching session emotions:', error);
      throw error;
    }
  }

  async getEmotionsByDateRange(
    studentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<EmotionRecord[]> {
    try {
      const result = await query(
        `SELECT * FROM emotion_records
         WHERE student_id = $1
         AND recorded_at BETWEEN $2 AND $3
         ORDER BY recorded_at ASC`,
        [studentId, startDate, endDate]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error fetching emotions by date range:', error);
      throw error;
    }
  }

  async updateEmotion(
    id: string,
    updates: Partial<CreateEmotionRequest>
  ): Promise<EmotionRecord> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (updates.emotion_type) {
        fields.push(`emotion_type = $${paramCount++}`);
        values.push(updates.emotion_type);
      }
      if (updates.intensity !== undefined) {
        fields.push(`intensity = $${paramCount++}`);
        values.push(updates.intensity);
      }
      if (updates.note !== undefined) {
        fields.push(`note = $${paramCount++}`);
        values.push(updates.note);
      }
      if (updates.context !== undefined) {
        fields.push(`context = $${paramCount++}`);
        values.push(JSON.stringify(updates.context));
      }

      values.push(id);

      const result = await query(
        `UPDATE emotion_records
         SET ${fields.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('Emotion record not found');
      }

      logger.info(`Emotion record ${id} updated`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating emotion record:', error);
      throw error;
    }
  }

  async deleteEmotion(id: string): Promise<void> {
    try {
      await query('DELETE FROM emotion_records WHERE id = $1', [id]);
      logger.info(`Emotion record ${id} deleted`);
    } catch (error) {
      logger.error('Error deleting emotion record:', error);
      throw error;
    }
  }

  async getEmotionDistribution(studentId: string, days: number = 7): Promise<Record<EmotionType, number>> {
    try {
      const result = await query(
        `SELECT emotion_type, COUNT(*) as count
         FROM emotion_records
         WHERE student_id = $1
         AND recorded_at >= NOW() - INTERVAL '${days} days'
         GROUP BY emotion_type`,
        [studentId]
      );

      const distribution: Record<string, number> = {};
      result.rows.forEach((row: any) => {
        distribution[row.emotion_type] = parseInt(row.count);
      });

      return distribution as Record<EmotionType, number>;
    } catch (error) {
      logger.error('Error getting emotion distribution:', error);
      throw error;
    }
  }
}

export default new EmotionService();
