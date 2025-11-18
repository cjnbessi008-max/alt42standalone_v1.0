import { Request, Response } from 'express';
import sessionService from '../services/sessionService';
import { CreateSessionRequest } from '../models/types';
import logger from '../utils/logger';

export class SessionController {
  async createSession(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateSessionRequest = req.body;

      // Validation
      if (!data.student_id || !data.course_id || !data.course_name) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const session = await sessionService.createSession(data);
      res.status(201).json(session);
    } catch (error) {
      logger.error('Error in createSession:', error);
      res.status(500).json({ error: 'Failed to create session' });
    }
  }

  async endSession(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = req.body;

      const session = await sessionService.endSession(id, data);
      res.json(session);
    } catch (error) {
      logger.error('Error in endSession:', error);
      res.status(500).json({ error: 'Failed to end session' });
    }
  }

  async getSessionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const session = await sessionService.getSessionById(id);

      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      res.json(session);
    } catch (error) {
      logger.error('Error in getSessionById:', error);
      res.status(500).json({ error: 'Failed to fetch session' });
    }
  }

  async getSessionsByStudent(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const sessions = await sessionService.getSessionsByStudent(studentId, limit);
      res.json(sessions);
    } catch (error) {
      logger.error('Error in getSessionsByStudent:', error);
      res.status(500).json({ error: 'Failed to fetch sessions' });
    }
  }

  async getActiveSessions(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const sessions = await sessionService.getActiveSessions(studentId);
      res.json(sessions);
    } catch (error) {
      logger.error('Error in getActiveSessions:', error);
      res.status(500).json({ error: 'Failed to fetch active sessions' });
    }
  }

  async getSessionStats(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const days = parseInt(req.query.days as string) || 7;

      const stats = await sessionService.getSessionStats(studentId, days);
      res.json(stats);
    } catch (error) {
      logger.error('Error in getSessionStats:', error);
      res.status(500).json({ error: 'Failed to fetch session stats' });
    }
  }
}

export default new SessionController();
