/**
 * LMS Integration API Routes
 * Endpoints for LMS connection and data synchronization
 */

import { Router, Request, Response } from 'express';
import { LMSIntegrationService } from '../services/LMSIntegrationService';

export function createLMSRouter(db: any): Router {
  const router = Router();
  const lmsService = new LMSIntegrationService(db);

  /**
   * POST /api/lms/integration
   * Create a new LMS integration
   * Body: { institutionName, lmsType, lmsUrl, consumerKey, consumerSecret, config }
   */
  router.post('/integration', async (req: Request, res: Response) => {
    try {
      const {
        institutionName,
        lmsType,
        lmsUrl,
        consumerKey,
        consumerSecret,
        config
      } = req.body;

      // Validate required fields
      if (!institutionName || !lmsType || !lmsUrl || !consumerKey || !consumerSecret) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      // Validate LMS type
      const validLmsTypes = ['canvas', 'moodle', 'blackboard', 'custom'];
      if (!validLmsTypes.includes(lmsType)) {
        return res.status(400).json({
          success: false,
          error: `Invalid LMS type. Must be one of: ${validLmsTypes.join(', ')}`
        });
      }

      const integration = await lmsService.createIntegration({
        institutionName,
        lmsType,
        lmsUrl,
        consumerKey,
        consumerSecret,
        config: config || {}
      });

      res.status(201).json({
        success: true,
        data: integration
      });
    } catch (error) {
      console.error('Error creating LMS integration:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create LMS integration',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/lms/integration
   * Get all LMS integrations
   */
  router.get('/integration', async (req: Request, res: Response) => {
    try {
      const integrations = await lmsService.getAllIntegrations();

      res.json({
        success: true,
        data: integrations
      });
    } catch (error) {
      console.error('Error fetching LMS integrations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch LMS integrations',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/lms/integration/:id
   * Get a specific LMS integration
   */
  router.get('/integration/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const integration = await lmsService.getIntegration(id);

      if (!integration) {
        return res.status(404).json({
          success: false,
          error: 'LMS integration not found'
        });
      }

      res.json({
        success: true,
        data: integration
      });
    } catch (error) {
      console.error('Error fetching LMS integration:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch LMS integration',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * PUT /api/lms/integration/:id
   * Update an LMS integration
   */
  router.put('/integration/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const integration = await lmsService.updateIntegration(id, updates);

      res.json({
        success: true,
        data: integration
      });
    } catch (error) {
      console.error('Error updating LMS integration:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update LMS integration',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * DELETE /api/lms/integration/:id
   * Delete an LMS integration
   */
  router.delete('/integration/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await lmsService.deleteIntegration(id);

      res.json({
        success: true,
        message: 'LMS integration deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting LMS integration:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete LMS integration',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/lms/sync/:integrationId
   * Trigger data synchronization with LMS
   * Body: { syncType: 'students' | 'grades' | 'concepts' | 'full', moduleId?: string }
   */
  router.post('/sync/:integrationId', async (req: Request, res: Response) => {
    try {
      const { integrationId } = req.params;
      const { syncType, moduleId } = req.body;

      // Validate sync type
      const validSyncTypes = ['students', 'grades', 'concepts', 'full'];
      if (!validSyncTypes.includes(syncType)) {
        return res.status(400).json({
          success: false,
          error: `Invalid sync type. Must be one of: ${validSyncTypes.join(', ')}`
        });
      }

      const syncLog = await lmsService.triggerSync(integrationId, syncType, moduleId);

      res.json({
        success: true,
        data: syncLog,
        message: 'Synchronization started'
      });
    } catch (error) {
      console.error('Error triggering LMS sync:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to trigger LMS sync',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/lms/sync/:integrationId/status
   * Get synchronization status and history
   */
  router.get('/sync/:integrationId/status', async (req: Request, res: Response) => {
    try {
      const { integrationId } = req.params;
      const { limit = '10' } = req.query;

      const syncLogs = await lmsService.getSyncHistory(integrationId, parseInt(limit as string));

      res.json({
        success: true,
        data: syncLogs
      });
    } catch (error) {
      console.error('Error fetching sync status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch sync status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/lms/webhook/lti-launch
   * Handle LTI launch requests from LMS
   */
  router.post('/webhook/lti-launch', async (req: Request, res: Response) => {
    try {
      const ltiParams = req.body;

      // Validate LTI parameters
      const validation = await lmsService.validateLTIRequest(ltiParams);
      if (!validation.valid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid LTI request',
          message: validation.error
        });
      }

      // Process LTI launch (create session, redirect to appropriate module)
      const launchData = await lmsService.processLTILaunch(ltiParams);

      res.json({
        success: true,
        data: launchData
      });
    } catch (error) {
      console.error('Error processing LTI launch:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process LTI launch',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/lms/grades/sync
   * Sync grades back to LMS
   * Body: { integrationId, moduleId, studentGrades: [{ studentId, score, maxScore }] }
   */
  router.post('/grades/sync', async (req: Request, res: Response) => {
    try {
      const { integrationId, moduleId, studentGrades } = req.body;

      if (!integrationId || !moduleId || !Array.isArray(studentGrades)) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: integrationId, moduleId, studentGrades'
        });
      }

      const result = await lmsService.syncGradesToLMS(integrationId, moduleId, studentGrades);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error syncing grades to LMS:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to sync grades to LMS',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}
