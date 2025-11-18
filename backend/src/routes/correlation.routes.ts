import { Router, Request, Response } from 'express';
import { CorrelationService } from '../services/correlation.service';

export function createCorrelationRouter(correlationService: CorrelationService): Router {
  const router = Router();

  /**
   * GET /api/correlation/:quizId
   * Get correlation data for a quiz
   */
  router.get('/:quizId', async (req: Request, res: Response) => {
    try {
      const quizId = parseInt(req.params.quizId, 10);

      if (isNaN(quizId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid quiz ID'
        });
      }

      const correlationData = await correlationService.getQuizCorrelationData(quizId);

      res.json({
        success: true,
        data: correlationData
      });
    } catch (error) {
      console.error(`Error calculating correlation for quiz ${req.params.quizId}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate correlation data',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/correlation/:quizId/top
   * Get top positive and negative correlations
   */
  router.get('/:quizId/top', async (req: Request, res: Response) => {
    try {
      const quizId = parseInt(req.params.quizId, 10);
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      if (isNaN(quizId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid quiz ID'
        });
      }

      const correlationData = await correlationService.getQuizCorrelationData(quizId);
      const topCorrelations = correlationService.getTopCorrelations(correlationData, limit);

      res.json({
        success: true,
        data: {
          quizId,
          quizName: correlationData.quizName,
          ...topCorrelations
        }
      });
    } catch (error) {
      console.error(`Error getting top correlations for quiz ${req.params.quizId}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to get top correlations',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}
