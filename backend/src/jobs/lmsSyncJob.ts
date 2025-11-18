import cron from 'node-cron';
import lmsService from '../services/lmsService';
import logger from '../utils/logger';

/**
 * Cron job to sync data from LMS
 * Runs every hour
 */
export const startLMSSyncJob = () => {
  const cronSchedule = process.env.LMS_SYNC_CRON || '0 * * * *'; // Default: every hour

  cron.schedule(cronSchedule, async () => {
    try {
      logger.info('Starting LMS sync job...');

      const integrations = await lmsService.getActiveIntegrations();

      for (const integration of integrations) {
        try {
          await lmsService.syncStudents(integration.id);
          logger.info(`Synced students for integration: ${integration.institution_name}`);
        } catch (error) {
          logger.error(`Failed to sync integration ${integration.id}:`, error);
        }
      }

      logger.info('✅ LMS sync job completed');
    } catch (error) {
      logger.error('❌ LMS sync job failed:', error);
    }
  });

  logger.info(`LMS sync job scheduled: ${cronSchedule}`);
};
