import cron from 'node-cron';
import dailySummaryService from '../services/dailySummaryService';
import logger from '../utils/logger';

/**
 * Cron job to generate daily emotion summaries
 * Runs every day at midnight (00:00 KST)
 */
export const startDailySummaryJob = () => {
  const cronSchedule = process.env.DAILY_SUMMARY_CRON || '0 0 * * *'; // Default: midnight

  cron.schedule(cronSchedule, async () => {
    try {
      logger.info('Starting daily summary generation job...');

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const summaries = await dailySummaryService.generateAllDailySummaries(yesterday);

      logger.info(`✅ Daily summary job completed. Generated ${summaries.length} summaries.`);
    } catch (error) {
      logger.error('❌ Daily summary job failed:', error);
    }
  });

  logger.info(`Daily summary job scheduled: ${cronSchedule}`);
};

/**
 * Manual trigger for daily summary generation (for testing)
 */
export const generateYesterdaySummaries = async () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  return await dailySummaryService.generateAllDailySummaries(yesterday);
};
