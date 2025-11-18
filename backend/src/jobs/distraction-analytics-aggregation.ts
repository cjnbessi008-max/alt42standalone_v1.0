/**
 * Distraction Analytics Aggregation Job
 *
 * Daily scheduled job to aggregate distraction data and calculate analytics
 *
 * Features:
 * - Aggregate raw events into daily statistics
 * - Calculate trends (week-over-week, month-over-month)
 * - Compute correlation with academic performance
 * - Generate insights and recommendations
 * - Clean up old raw data (optional)
 *
 * Usage:
 * - Run manually: node dist/jobs/distraction-analytics-aggregation.js
 * - Schedule with cron: 0 2 * * * (daily at 2 AM)
 */

import { Pool } from 'pg';
import { format, subDays, subWeeks, subMonths } from 'date-fns';

interface AggregationResult {
  date: string;
  totalStudents: number;
  totalSessions: number;
  totalEvents: number;
  avgDistractionPercentage: number;
  recordsProcessed: number;
}

class DistractionAnalyticsAggregation {
  private db: Pool;

  constructor() {
    this.db = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'ai_education',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      max: 10,
    });
  }

  /**
   * Main execution method
   */
  async run(): Promise<void> {
    console.log('='.repeat(80));
    console.log('Distraction Analytics Aggregation Job');
    console.log(`Started at: ${new Date().toISOString()}`);
    console.log('='.repeat(80));

    try {
      // 1. Aggregate yesterday's data
      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      console.log(`\nAggregating data for: ${yesterday}`);

      const result = await this.aggregateDailyData(yesterday);

      console.log(`\nResults:`);
      console.log(`  - Students processed: ${result.totalStudents}`);
      console.log(`  - Sessions processed: ${result.totalSessions}`);
      console.log(`  - Events processed: ${result.totalEvents}`);
      console.log(`  - Avg distraction %: ${result.avgDistractionPercentage.toFixed(2)}%`);
      console.log(`  - Records created: ${result.recordsProcessed}`);

      // 2. Calculate trends
      console.log(`\nCalculating trends...`);
      await this.calculateTrends(yesterday);

      // 3. Correlate with academic performance
      console.log(`\nCorrelating with academic performance...`);
      await this.correlateWithPerformance(yesterday);

      // 4. Generate insights
      console.log(`\nGenerating insights...`);
      await this.generateInsights(yesterday);

      // 5. Optional: Clean up old raw data (older than 90 days)
      if (process.env.CLEANUP_OLD_DATA === 'true') {
        console.log(`\nCleaning up old data...`);
        await this.cleanupOldData(90);
      }

      console.log(`\n${'='.repeat(80)}`);
      console.log(`Job completed successfully at: ${new Date().toISOString()}`);
      console.log('='.repeat(80));
    } catch (error) {
      console.error(`\nError during aggregation:`, error);
      throw error;
    } finally {
      await this.db.end();
    }
  }

  /**
   * Aggregate daily distraction data
   */
  private async aggregateDailyData(date: string): Promise<AggregationResult> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      // Get all unique student-module combinations for the date
      const studentModuleQuery = `
        SELECT DISTINCT
          de.student_id,
          de.module_id
        FROM distraction_events de
        WHERE DATE(de.event_timestamp) = $1
      `;

      const studentModules = await client.query(studentModuleQuery, [date]);

      let totalSessions = 0;
      let totalEvents = 0;
      let totalDistractionPercentage = 0;
      let recordsProcessed = 0;

      // Process each student-module combination
      for (const row of studentModules.rows) {
        const { student_id, module_id } = row;

        // Aggregate session data
        const sessionQuery = `
          SELECT
            COUNT(DISTINCT ds.session_id) as sessions_count,
            SUM(ds.total_duration_seconds) as total_session_duration,
            SUM(ds.total_events) as total_events,
            SUM(ds.total_distraction_duration_seconds) as total_distraction_duration,
            ROUND(AVG(ds.distraction_percentage), 2) as avg_distraction_percentage
          FROM distraction_sessions ds
          WHERE ds.student_id = $1
            AND ds.module_id = $2
            AND DATE(ds.session_start) = $3
        `;

        const sessionResult = await client.query(sessionQuery, [student_id, module_id, date]);
        const sessionData = sessionResult.rows[0];

        // Get event type breakdown
        const eventTypeQuery = `
          SELECT
            event_type,
            COUNT(*) as count,
            SUM(duration_seconds) as total_duration
          FROM distraction_events
          WHERE student_id = $1
            AND module_id = $2
            AND DATE(event_timestamp) = $3
          GROUP BY event_type
        `;

        const eventTypeResult = await client.query(eventTypeQuery, [student_id, module_id, date]);

        const eventTypeBreakdown: Record<string, any> = {};
        eventTypeResult.rows.forEach((row) => {
          eventTypeBreakdown[row.event_type] = {
            count: parseInt(row.count),
            totalDuration: parseInt(row.total_duration),
          };
        });

        // Get severity breakdown
        const severityQuery = `
          SELECT
            severity_level,
            COUNT(*) as count
          FROM distraction_events
          WHERE student_id = $1
            AND module_id = $2
            AND DATE(event_timestamp) = $3
          GROUP BY severity_level
        `;

        const severityResult = await client.query(severityQuery, [student_id, module_id, date]);

        const severityBreakdown: Record<string, number> = {};
        severityResult.rows.forEach((row) => {
          severityBreakdown[row.severity_level] = parseInt(row.count);
        });

        // Get academic performance data
        const performanceQuery = `
          SELECT
            COUNT(*) as problems_attempted,
            SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as problems_correct
          FROM ${module_id}_problem_submissions
          WHERE student_id = $1
            AND DATE(submitted_at) = $2
        `;

        let problemsAttempted = 0;
        let problemsCorrect = 0;
        let accuracyPercentage = 0;

        try {
          const performanceResult = await client.query(performanceQuery, [student_id, date]);
          problemsAttempted = parseInt(performanceResult.rows[0].problems_attempted || '0');
          problemsCorrect = parseInt(performanceResult.rows[0].problems_correct || '0');
          accuracyPercentage = problemsAttempted > 0 ? (problemsCorrect / problemsAttempted) * 100 : 0;
        } catch (err) {
          // Table might not exist for this module
          console.warn(`Could not fetch performance data for module ${module_id}`);
        }

        // Insert or update daily analytics
        const upsertQuery = `
          INSERT INTO daily_distraction_analytics (
            id, student_id, module_id, date,
            sessions_count, total_session_duration_seconds,
            total_distraction_events, total_distraction_duration_seconds,
            average_distraction_percentage,
            event_type_breakdown, severity_breakdown,
            problems_attempted, problems_correct, accuracy_percentage
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
          )
          ON CONFLICT (student_id, module_id, date)
          DO UPDATE SET
            sessions_count = EXCLUDED.sessions_count,
            total_session_duration_seconds = EXCLUDED.total_session_duration_seconds,
            total_distraction_events = EXCLUDED.total_distraction_events,
            total_distraction_duration_seconds = EXCLUDED.total_distraction_duration_seconds,
            average_distraction_percentage = EXCLUDED.average_distraction_percentage,
            event_type_breakdown = EXCLUDED.event_type_breakdown,
            severity_breakdown = EXCLUDED.severity_breakdown,
            problems_attempted = EXCLUDED.problems_attempted,
            problems_correct = EXCLUDED.problems_correct,
            accuracy_percentage = EXCLUDED.accuracy_percentage,
            updated_at = NOW()
        `;

        await client.query(upsertQuery, [
          student_id,
          module_id,
          date,
          parseInt(sessionData.sessions_count || '0'),
          parseInt(sessionData.total_session_duration || '0'),
          parseInt(sessionData.total_events || '0'),
          parseInt(sessionData.total_distraction_duration || '0'),
          parseFloat(sessionData.avg_distraction_percentage || '0'),
          JSON.stringify(eventTypeBreakdown),
          JSON.stringify(severityBreakdown),
          problemsAttempted,
          problemsCorrect,
          accuracyPercentage,
        ]);

        totalSessions += parseInt(sessionData.sessions_count || '0');
        totalEvents += parseInt(sessionData.total_events || '0');
        totalDistractionPercentage += parseFloat(sessionData.avg_distraction_percentage || '0');
        recordsProcessed++;
      }

      await client.query('COMMIT');

      return {
        date,
        totalStudents: studentModules.rows.length,
        totalSessions,
        totalEvents,
        avgDistractionPercentage:
          recordsProcessed > 0 ? totalDistractionPercentage / recordsProcessed : 0,
        recordsProcessed,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Calculate week-over-week and month-over-month trends
   */
  private async calculateTrends(date: string): Promise<void> {
    const weekAgo = format(subWeeks(new Date(date), 1), 'yyyy-MM-dd');
    const monthAgo = format(subMonths(new Date(date), 1), 'yyyy-MM-dd');

    const query = `
      UPDATE daily_distraction_analytics dda_current
      SET
        trend_week_over_week = CASE
          WHEN dda_week.average_distraction_percentage > 0
          THEN ROUND(
            ((dda_current.average_distraction_percentage - dda_week.average_distraction_percentage)
            / dda_week.average_distraction_percentage) * 100,
            2
          )
          ELSE NULL
        END,
        trend_month_over_month = CASE
          WHEN dda_month.average_distraction_percentage > 0
          THEN ROUND(
            ((dda_current.average_distraction_percentage - dda_month.average_distraction_percentage)
            / dda_month.average_distraction_percentage) * 100,
            2
          )
          ELSE NULL
        END
      FROM daily_distraction_analytics dda_week,
           daily_distraction_analytics dda_month
      WHERE dda_current.date = $1
        AND dda_week.student_id = dda_current.student_id
        AND dda_week.module_id = dda_current.module_id
        AND dda_week.date = $2
        AND dda_month.student_id = dda_current.student_id
        AND dda_month.module_id = dda_current.module_id
        AND dda_month.date = $3
    `;

    const result = await this.db.query(query, [date, weekAgo, monthAgo]);
    console.log(`  - Trends calculated for ${result.rowCount} records`);
  }

  /**
   * Correlate distraction data with academic performance
   */
  private async correlateWithPerformance(date: string): Promise<void> {
    // This is a simplified correlation analysis
    // In production, you might want to use more sophisticated statistical methods

    const query = `
      SELECT
        CASE
          WHEN average_distraction_percentage < 10 THEN 'Low'
          WHEN average_distraction_percentage < 30 THEN 'Medium'
          ELSE 'High'
        END as distraction_level,
        ROUND(AVG(accuracy_percentage), 2) as avg_accuracy,
        COUNT(*) as student_count
      FROM daily_distraction_analytics
      WHERE date = $1
        AND accuracy_percentage IS NOT NULL
      GROUP BY distraction_level
      ORDER BY distraction_level
    `;

    const result = await this.db.query(query, [date]);

    console.log(`  - Correlation analysis:`);
    result.rows.forEach((row) => {
      console.log(
        `    ${row.distraction_level} distraction: ${row.avg_accuracy}% accuracy (${row.student_count} students)`
      );
    });
  }

  /**
   * Generate insights and recommendations
   */
  private async generateInsights(date: string): Promise<void> {
    // Identify students who need intervention
    const highDistractionQuery = `
      SELECT
        student_id,
        module_id,
        average_distraction_percentage,
        accuracy_percentage,
        trend_week_over_week
      FROM daily_distraction_analytics
      WHERE date = $1
        AND average_distraction_percentage > 50
      ORDER BY average_distraction_percentage DESC
      LIMIT 10
    `;

    const result = await this.db.query(highDistractionQuery, [date]);

    if (result.rows.length > 0) {
      console.log(`  - ${result.rows.length} students identified for intervention`);
      console.log(`  - Top 3 students with highest distraction:`);

      result.rows.slice(0, 3).forEach((row, index) => {
        console.log(
          `    ${index + 1}. Student ${row.student_id}: ${row.average_distraction_percentage.toFixed(2)}% distraction, ${row.accuracy_percentage?.toFixed(2) || 'N/A'}% accuracy`
        );
      });
    } else {
      console.log(`  - No students identified for intervention`);
    }

    // Identify improving students
    const improvingQuery = `
      SELECT
        student_id,
        module_id,
        average_distraction_percentage,
        trend_week_over_week
      FROM daily_distraction_analytics
      WHERE date = $1
        AND trend_week_over_week < -20
      ORDER BY trend_week_over_week ASC
      LIMIT 5
    `;

    const improvingResult = await this.db.query(improvingQuery, [date]);

    if (improvingResult.rows.length > 0) {
      console.log(`  - ${improvingResult.rows.length} students showing improvement`);
    }
  }

  /**
   * Clean up old raw data
   */
  private async cleanupOldData(daysToKeep: number): Promise<void> {
    const cutoffDate = format(subDays(new Date(), daysToKeep), 'yyyy-MM-dd');

    const deleteEventsQuery = `
      DELETE FROM distraction_events
      WHERE event_timestamp < $1::date
    `;

    const result = await this.db.query(deleteEventsQuery, [cutoffDate]);

    console.log(`  - Deleted ${result.rowCount} old distraction events (older than ${daysToKeep} days)`);
  }
}

// ============================================================================
// CLI Execution
// ============================================================================

if (require.main === module) {
  const job = new DistractionAnalyticsAggregation();

  job
    .run()
    .then(() => {
      console.log('\nJob completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nJob failed:', error);
      process.exit(1);
    });
}

export default DistractionAnalyticsAggregation;
