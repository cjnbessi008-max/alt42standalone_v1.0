import { Router, Request, Response, NextFunction } from 'express';
import { TriangleService } from '../services/triangleService';
import { createError } from '../middleware/errorHandler';

const router = Router();
const triangleService = new TriangleService();

/**
 * POST /api/triangles/detect
 * Detect triangles in problem data and identify similar triangles
 */
router.post('/detect', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { problemId, geometryData } = req.body;

    if (!geometryData) {
      throw createError('Geometry data is required', 400);
    }

    const result = await triangleService.detectAndAnalyze(problemId, geometryData);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/triangles/problem/:problemId
 * Get all triangles for a specific problem
 */
router.get('/problem/:problemId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { problemId } = req.params;
    const triangles = await triangleService.getTrianglesByProblem(problemId);

    res.json({
      success: true,
      data: triangles
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/triangles/similar/:problemId
 * Get similar triangle groups for a problem
 */
router.get('/similar/:problemId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { problemId } = req.params;
    const groups = await triangleService.getSimilarTriangleGroups(problemId);

    res.json({
      success: true,
      data: groups
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/triangles/analyze
 * Analyze triangle similarity
 */
router.post('/analyze', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { triangle1, triangle2 } = req.body;

    if (!triangle1 || !triangle2) {
      throw createError('Two triangles are required for comparison', 400);
    }

    const similarity = triangleService.checkSimilarity(triangle1, triangle2);

    res.json({
      success: true,
      data: {
        isSimilar: similarity.isSimilar,
        ratio: similarity.ratio,
        method: similarity.method,
        details: similarity.details
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
