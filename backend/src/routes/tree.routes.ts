import { Router, Request, Response, NextFunction } from 'express';
import treeService from '../services/tree.service';
import problemService from '../services/problem.service';
import { createError } from '../middleware/errorHandler';
import { ApiResponse } from '../types';

const router = Router();

/**
 * POST /api/tree/calculate
 * Calculate tree outcomes and probabilities
 */
router.post('/calculate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { problemId } = req.body;

    if (!problemId) {
      throw createError('Problem ID is required', 400);
    }

    const nodes = await problemService.getTreeNodes(problemId);
    if (nodes.length === 0) {
      throw createError('No tree nodes found for this problem', 404);
    }

    const result = treeService.calculateOutcomes(nodes);

    const response: ApiResponse = {
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/tree/generate
 * Generate tree nodes from configuration
 */
router.post('/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { problemId, treeConfig } = req.body;

    if (!problemId || !treeConfig) {
      throw createError('Problem ID and tree configuration are required', 400);
    }

    const problem = await problemService.getProblemById(problemId);
    if (!problem) {
      throw createError('Problem not found', 404);
    }

    const nodes = treeService.generateTreeNodes(treeConfig, problemId);
    await problemService.saveTreeNodes(nodes);

    const response: ApiResponse = {
      success: true,
      data: {
        nodes,
        count: nodes.length
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/tree/layout
 * Calculate tree layout positions
 */
router.post('/layout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nodes, width, height } = req.body;

    if (!nodes || !Array.isArray(nodes)) {
      throw createError('Tree nodes array is required', 400);
    }

    const layoutNodes = treeService.calculateLayout(nodes, width, height);

    const response: ApiResponse = {
      success: true,
      data: layoutNodes,
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
