import { query } from '../config/database';
import { DailyEmotionSummary, EmotionType, EmotionTrend } from '../models/types';
import logger from '../utils/logger';

export class DailySummaryService {
  /**
   * Generate daily emotion summary for a specific student and date
   */
  async generateDailySummary(studentId: string, date: Date): Promise<DailyEmotionSummary> {
    try {
      const dateStr = date.toISOString().split('T')[0];

      // Get all emotion records for the day
      const emotionsResult = await query(
        `SELECT emotion_type, intensity, COUNT(*) as count
         FROM emotion_records
         WHERE student_id = $1
         AND DATE(recorded_at) = $2
         GROUP BY emotion_type, intensity`,
        [studentId, dateStr]
      );

      // Get learning session stats for the day
      const sessionsResult = await query(
        `SELECT
          COUNT(*) as session_count,
          COALESCE(SUM(duration_minutes), 0) as total_minutes
         FROM learning_sessions
         WHERE student_id = $1
         AND DATE(started_at) = $2`,
        [studentId, dateStr]
      );

      const emotionData = emotionsResult.rows;
      const sessionData = sessionsResult.rows[0];

      if (emotionData.length === 0) {
        logger.info(`No emotion data for student ${studentId} on ${dateStr}`);
        return this.createEmptySummary(studentId, date);
      }

      // Calculate emotion distribution
      const emotionDistribution: Record<EmotionType, number> = {
        happy: 0,
        neutral: 0,
        confused: 0,
        frustrated: 0,
        confident: 0,
      };

      let totalIntensity = 0;
      let totalRecords = 0;

      emotionData.forEach((row: any) => {
        const count = parseInt(row.count);
        emotionDistribution[row.emotion_type as EmotionType] += count;
        totalIntensity += row.intensity * count;
        totalRecords += count;
      });

      // Find dominant emotion
      const dominantEmotion = Object.entries(emotionDistribution).reduce(
        (max, [emotion, count]) =>
          count > max.count ? { emotion: emotion as EmotionType, count } : max,
        { emotion: 'neutral' as EmotionType, count: 0 }
      ).emotion;

      const averageIntensity = totalRecords > 0 ? totalIntensity / totalRecords : 0;

      // Calculate emotion trend (compare with previous days)
      const emotionTrend = await this.calculateEmotionTrend(studentId, date);

      // Insert or update daily summary
      const result = await query(
        `INSERT INTO daily_emotion_summaries
         (student_id, summary_date, total_learning_minutes, session_count,
          emotion_distribution, dominant_emotion, average_intensity, emotion_trend)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (student_id, summary_date)
         DO UPDATE SET
           total_learning_minutes = EXCLUDED.total_learning_minutes,
           session_count = EXCLUDED.session_count,
           emotion_distribution = EXCLUDED.emotion_distribution,
           dominant_emotion = EXCLUDED.dominant_emotion,
           average_intensity = EXCLUDED.average_intensity,
           emotion_trend = EXCLUDED.emotion_trend,
           generated_at = NOW()
         RETURNING *`,
        [
          studentId,
          dateStr,
          sessionData.total_minutes || 0,
          sessionData.session_count || 0,
          JSON.stringify(emotionDistribution),
          dominantEmotion,
          averageIntensity.toFixed(2),
          emotionTrend,
        ]
      );

      logger.info(`Daily summary generated for student ${studentId} on ${dateStr}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error generating daily summary:', error);
      throw error;
    }
  }

  /**
   * Generate daily summaries for all students for a specific date
   */
  async generateAllDailySummaries(date: Date): Promise<DailyEmotionSummary[]> {
    try {
      const dateStr = date.toISOString().split('T')[0];

      // Get all students who had activity on this date
      const studentsResult = await query(
        `SELECT DISTINCT student_id
         FROM emotion_records
         WHERE DATE(recorded_at) = $1`,
        [dateStr]
      );

      const summaries: DailyEmotionSummary[] = [];

      for (const row of studentsResult.rows) {
        const summary = await this.generateDailySummary(row.student_id, date);
        summaries.push(summary);
      }

      logger.info(`Generated ${summaries.length} daily summaries for ${dateStr}`);
      return summaries;
    } catch (error) {
      logger.error('Error generating all daily summaries:', error);
      throw error;
    }
  }

  /**
   * Get daily summary for a student on a specific date
   */
  async getDailySummary(studentId: string, date: Date): Promise<DailyEmotionSummary | null> {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const result = await query(
        `SELECT * FROM daily_emotion_summaries
         WHERE student_id = $1 AND summary_date = $2`,
        [studentId, dateStr]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error fetching daily summary:', error);
      throw error;
    }
  }

  /**
   * Get daily summaries for a student within a date range
   */
  async getDailySummaries(
    studentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DailyEmotionSummary[]> {
    try {
      const result = await query(
        `SELECT * FROM daily_emotion_summaries
         WHERE student_id = $1
         AND summary_date BETWEEN $2 AND $3
         ORDER BY summary_date DESC`,
        [studentId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error fetching daily summaries:', error);
      throw error;
    }
  }

  /**
   * Calculate emotion trend based on recent history
   */
  private async calculateEmotionTrend(studentId: string, currentDate: Date): Promise<EmotionTrend> {
    try {
      // Get summaries from the past 7 days (excluding current date)
      const sevenDaysAgo = new Date(currentDate);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const result = await query(
        `SELECT average_intensity, summary_date
         FROM daily_emotion_summaries
         WHERE student_id = $1
         AND summary_date BETWEEN $2 AND $3
         AND summary_date < $4
         ORDER BY summary_date ASC`,
        [
          studentId,
          sevenDaysAgo.toISOString().split('T')[0],
          currentDate.toISOString().split('T')[0],
          currentDate.toISOString().split('T')[0],
        ]
      );

      if (result.rows.length < 2) {
        return 'stable';
      }

      // Simple trend calculation: compare first half with second half
      const mid = Math.floor(result.rows.length / 2);
      const firstHalf = result.rows.slice(0, mid);
      const secondHalf = result.rows.slice(mid);

      const avgFirst =
        firstHalf.reduce((sum: number, row: any) => sum + parseFloat(row.average_intensity), 0) /
        firstHalf.length;
      const avgSecond =
        secondHalf.reduce((sum: number, row: any) => sum + parseFloat(row.average_intensity), 0) /
        secondHalf.length;

      const difference = avgSecond - avgFirst;

      // Threshold for trend detection
      if (difference > 0.3) return 'improving';
      if (difference < -0.3) return 'declining';
      return 'stable';
    } catch (error) {
      logger.error('Error calculating emotion trend:', error);
      return 'stable';
    }
  }

  /**
   * Create empty summary when no data is available
   */
  private createEmptySummary(studentId: string, date: Date): DailyEmotionSummary {
    return {
      id: '',
      student_id: studentId,
      summary_date: date,
      total_learning_minutes: 0,
      session_count: 0,
      emotion_distribution: { happy: 0, neutral: 0, confused: 0, frustrated: 0, confident: 0 },
      dominant_emotion: 'neutral',
      average_intensity: 0,
      emotion_trend: 'stable',
      generated_at: new Date(),
    };
  }
}

export default new DailySummaryService();
