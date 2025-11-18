import { Request, Response } from 'express';
import { SubmissionModel } from '../models/submissionModel';
import { logger } from '../config/logger';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database';
import { SubmitToLMSRequest, LMSSubmissionResponse } from '../types';

export class LMSController {
  /**
   * Submit to LMS (or mock LMS)
   */
  static async submitToLMS(req: Request, res: Response): Promise<void> {
    try {
      const { submission_id, force_submit = false } = req.body as SubmitToLMSRequest;

      if (!submission_id) {
        res.status(400).json({
          success: false,
          error: 'submission_id is required'
        });
        return;
      }

      const submission = SubmissionModel.findById(submission_id);
      if (!submission) {
        res.status(404).json({
          success: false,
          error: 'Submission not found'
        });
        return;
      }

      // Check if submission is validated
      if (submission.status !== 'validated' && !force_submit) {
        res.status(400).json({
          success: false,
          error: 'Submission must be validated before submitting to LMS. Use force_submit=true to override.'
        });
        return;
      }

      // Check if already synced
      const existingSync = db.prepare(
        'SELECT * FROM lms_sync WHERE submission_id = ? AND sync_status = ?'
      ).get(submission_id, 'synced');

      if (existingSync) {
        res.status(400).json({
          success: false,
          error: 'Submission already synced to LMS'
        });
        return;
      }

      // Mock LMS submission (in real implementation, call actual LMS API)
      const lmsEnabled = process.env.LMS_ENABLED === 'true';

      let syncStatus: 'pending' | 'synced' | 'failed' = 'pending';
      let lmsSubmissionId: string | null = null;
      let errorLog: string | null = null;

      if (lmsEnabled) {
        // TODO: Implement actual LMS API call
        // const lmsResponse = await callLMSAPI(submission);
        logger.info('LMS integration is enabled - would call real API here');
        syncStatus = 'synced';
        lmsSubmissionId = `lms_${uuidv4()}`;
      } else {
        // Mock success
        logger.info('LMS integration disabled - using mock');
        syncStatus = 'synced';
        lmsSubmissionId = `mock_lms_${uuidv4()}`;
      }

      // Create LMS sync record
      const syncId = uuidv4();
      db.prepare(`
        INSERT INTO lms_sync
        (id, submission_id, lms_submission_id, sync_status, sync_attempts, last_sync_attempt, error_log, synced_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
      `).run(
        syncId,
        submission_id,
        lmsSubmissionId,
        syncStatus,
        1,
        errorLog,
        syncStatus === 'synced' ? new Date().toISOString() : null
      );

      // Update submission status
      SubmissionModel.updateStatus(submission_id, 'submitted');

      const response: LMSSubmissionResponse = {
        success: syncStatus === 'synced',
        lms_submission_id: lmsSubmissionId || undefined,
        message: syncStatus === 'synced'
          ? 'Successfully submitted to LMS'
          : 'Submission queued for LMS sync',
        sync_status: syncStatus
      };

      logger.info('LMS submission completed', {
        submissionId: submission_id,
        lmsSubmissionId,
        syncStatus
      });

      res.status(200).json({
        success: true,
        data: response
      });
    } catch (error) {
      logger.error('Error submitting to LMS:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit to LMS'
      });
    }
  }

  /**
   * Get LMS sync status
   */
  static async getSyncStatus(req: Request, res: Response): Promise<void> {
    try {
      const { submissionId } = req.params;

      const syncRecords = db.prepare(
        'SELECT * FROM lms_sync WHERE submission_id = ? ORDER BY last_sync_attempt DESC'
      ).all(submissionId);

      res.status(200).json({
        success: true,
        data: syncRecords
      });
    } catch (error) {
      logger.error('Error getting sync status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get sync status'
      });
    }
  }

  /**
   * Retry failed LMS sync
   */
  static async retrySync(req: Request, res: Response): Promise<void> {
    try {
      const { syncId } = req.params;

      const syncRecord = db.prepare(
        'SELECT * FROM lms_sync WHERE id = ?'
      ).get(syncId) as any;

      if (!syncRecord) {
        res.status(404).json({
          success: false,
          error: 'Sync record not found'
        });
        return;
      }

      if (syncRecord.sync_status === 'synced') {
        res.status(400).json({
          success: false,
          error: 'Sync already completed successfully'
        });
        return;
      }

      // Mock retry (in real implementation, call actual LMS API)
      const lmsSubmissionId = `retry_lms_${uuidv4()}`;
      const syncStatus = 'synced';

      db.prepare(`
        UPDATE lms_sync
        SET lms_submission_id = ?,
            sync_status = ?,
            sync_attempts = sync_attempts + 1,
            last_sync_attempt = CURRENT_TIMESTAMP,
            synced_at = CURRENT_TIMESTAMP,
            error_log = NULL
        WHERE id = ?
      `).run(lmsSubmissionId, syncStatus, syncId);

      logger.info('LMS sync retried', { syncId, lmsSubmissionId });

      res.status(200).json({
        success: true,
        data: {
          sync_id: syncId,
          lms_submission_id: lmsSubmissionId,
          sync_status: syncStatus,
          message: 'Sync retry successful'
        }
      });
    } catch (error) {
      logger.error('Error retrying sync:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retry sync'
      });
    }
  }
}
