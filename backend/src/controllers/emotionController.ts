import { Request, Response } from 'express';
import emotionService from '../services/emotionService';
import { CreateEmotionRequest } from '../models/types';
import logger from '../utils/logger';

export class EmotionController {
  async createEmotion(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateEmotionRequest = req.body;

      // Validation
      if (!data.student_id || !data.emotion_type || !data.intensity) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      if (data.intensity < 1 || data.intensity > 5) {
        res.status(400).json({ error: 'Intensity must be between 1 and 5' });
        return;
      }

      const emotion = await emotionService.createEmotion(data);
      res.status(201).json(emotion);
    } catch (error) {
      logger.error('Error in createEmotion:', error);
      res.status(500).json({ error: 'Failed to create emotion record' });
    }
  }

  async getEmotionsByStudent(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const emotions = await emotionService.getEmotionsByStudent(studentId, limit);
      res.json(emotions);
    } catch (error) {
      logger.error('Error in getEmotionsByStudent:', error);
      res.status(500).json({ error: 'Failed to fetch emotions' });
    }
  }

  async getEmotionsBySession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const emotions = await emotionService.getEmotionsBySession(sessionId);
      res.json(emotions);
    } catch (error) {
      logger.error('Error in getEmotionsBySession:', error);
      res.status(500).json({ error: 'Failed to fetch session emotions' });
    }
  }

  async updateEmotion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      const emotion = await emotionService.updateEmotion(id, updates);
      res.json(emotion);
    } catch (error) {
      logger.error('Error in updateEmotion:', error);
      res.status(500).json({ error: 'Failed to update emotion record' });
    }
  }

  async deleteEmotion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await emotionService.deleteEmotion(id);
      res.status(204).send();
    } catch (error) {
      logger.error('Error in deleteEmotion:', error);
      res.status(500).json({ error: 'Failed to delete emotion record' });
    }
  }

  async getEmotionDistribution(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const days = parseInt(req.query.days as string) || 7;

      const distribution = await emotionService.getEmotionDistribution(studentId, days);
      res.json(distribution);
    } catch (error) {
      logger.error('Error in getEmotionDistribution:', error);
      res.status(500).json({ error: 'Failed to fetch emotion distribution' });
    }
  }
}

export default new EmotionController();
