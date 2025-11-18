import { Router, Request, Response } from 'express';
import databaseService from '../services/databaseService';
import { ApiResponse, TrapPoint } from '../types';

const router = Router();

/**
 * GET /api/trap-points/:questionId
 * Get trap points for a question
 */
router.get('/:questionId', async (req: Request, res: Response) => {
  try {
    const questionId = parseInt(req.params.questionId);

    if (isNaN(questionId)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid question ID',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const trapPoints = await databaseService.getTrapPoints(questionId);

    const response: ApiResponse<TrapPoint[]> = {
      success: true,
      data: trapPoints,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error('Error in GET /api/trap-points/:questionId:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

/**
 * POST /api/trap-points
 * Create or update trap point
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const trapPoint = req.body as Omit<TrapPoint, 'id'>;

    // Validate required fields
    if (
      !trapPoint.questionId ||
      !trapPoint.type ||
      !trapPoint.position ||
      !trapPoint.severity
    ) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Missing required fields',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const trapPointId = await databaseService.upsertTrapPoint(trapPoint);

    const response: ApiResponse<{ id: number }> = {
      success: true,
      data: { id: trapPointId },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error('Error in POST /api/trap-points:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

/**
 * DELETE /api/trap-points/:trapPointId
 * Delete trap point
 */
router.delete('/:trapPointId', async (req: Request, res: Response) => {
  try {
    const trapPointId = parseInt(req.params.trapPointId);

    if (isNaN(trapPointId)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid trap point ID',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const deleted = await databaseService.deleteTrapPoint(trapPointId);

    if (!deleted) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Trap point not found',
        timestamp: new Date().toISOString(),
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<{ deleted: boolean }> = {
      success: true,
      data: { deleted: true },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error('Error in DELETE /api/trap-points/:trapPointId:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

export default router;
