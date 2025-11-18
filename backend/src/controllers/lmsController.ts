import { Request, Response } from 'express';
import lmsService from '../services/lmsService';
import logger from '../utils/logger';

export class LMSController {
  async createIntegration(req: Request, res: Response): Promise<void> {
    try {
      const { institution_name, lms_type, lms_url, client_id, client_secret, config } = req.body;

      // Validation
      if (!institution_name || !lms_type || !lms_url || !client_id || !client_secret) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const integration = await lmsService.createIntegration({
        institution_name,
        lms_type,
        lms_url,
        client_id,
        client_secret,
        config,
      });

      // Don't send encrypted secrets in response
      const responseData = {
        ...integration,
        client_secret_encrypted: undefined,
        access_token_encrypted: undefined,
        refresh_token_encrypted: undefined,
      };

      res.status(201).json(responseData);
    } catch (error) {
      logger.error('Error in createIntegration:', error);
      res.status(500).json({ error: 'Failed to create LMS integration' });
    }
  }

  async getIntegration(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const integration = await lmsService.getIntegration(id);

      if (!integration) {
        res.status(404).json({ error: 'Integration not found' });
        return;
      }

      // Don't send encrypted secrets in response
      const responseData = {
        ...integration,
        client_secret_encrypted: undefined,
        access_token_encrypted: undefined,
        refresh_token_encrypted: undefined,
      };

      res.json(responseData);
    } catch (error) {
      logger.error('Error in getIntegration:', error);
      res.status(500).json({ error: 'Failed to fetch integration' });
    }
  }

  async getActiveIntegrations(req: Request, res: Response): Promise<void> {
    try {
      const integrations = await lmsService.getActiveIntegrations();

      // Don't send encrypted secrets in response
      const responseData = integrations.map((integration) => ({
        ...integration,
        client_secret_encrypted: undefined,
        access_token_encrypted: undefined,
        refresh_token_encrypted: undefined,
      }));

      res.json(responseData);
    } catch (error) {
      logger.error('Error in getActiveIntegrations:', error);
      res.status(500).json({ error: 'Failed to fetch integrations' });
    }
  }

  async syncStudents(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const students = await lmsService.syncStudents(id);

      res.json({
        message: `Successfully synced ${students.length} students`,
        count: students.length,
        students,
      });
    } catch (error) {
      logger.error('Error in syncStudents:', error);
      res.status(500).json({ error: 'Failed to sync students' });
    }
  }

  async storeTokens(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { access_token, refresh_token, expires_in } = req.body;

      if (!access_token) {
        res.status(400).json({ error: 'Access token is required' });
        return;
      }

      await lmsService.storeTokens(id, access_token, refresh_token, expires_in);

      res.json({ message: 'Tokens stored successfully' });
    } catch (error) {
      logger.error('Error in storeTokens:', error);
      res.status(500).json({ error: 'Failed to store tokens' });
    }
  }
}

export default new LMSController();
