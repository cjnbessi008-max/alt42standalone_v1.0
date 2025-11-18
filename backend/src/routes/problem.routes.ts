import { Router, Request, Response, NextFunction } from 'express';
import problemService from '../services/problem.service';
import treeService from '../services/tree.service';
import { createError } from '../middleware/errorHandler';
import { ApiResponse } from '../types';

const router = Router();

/**
 * GET /api/problems
 * Get all problems
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const problems = await problemService.getAllProblems();

    const response: ApiResponse = {
      success: true,
      data: problems,
      meta: {
        timestamp: new Date().toISOString(),
        count: problems.length
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/problems/:id
 * Get problem by ID with tree nodes
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw createError('Invalid problem ID', 400);
    }

    const problem = await problemService.getProblemById(id);
    if (!problem) {
      throw createError('Problem not found', 404);
    }

    const treeNodes = await problemService.getTreeNodes(id);

    const response: ApiResponse = {
      success: true,
      data: {
        problem,
        treeNodes
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
 * GET /api/problems/moodle/:quizId
 * Get problem by Moodle quiz ID
 */
router.get('/moodle/:quizId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quizId = parseInt(req.params.quizId);
    if (isNaN(quizId)) {
      throw createError('Invalid Moodle quiz ID', 400);
    }

    const problem = await problemService.getProblemByMoodleQuizId(quizId);
    if (!problem) {
      throw createError('Problem not found for this Moodle quiz', 404);
    }

    const treeNodes = await problemService.getTreeNodes(problem.id);

    const response: ApiResponse = {
      success: true,
      data: {
        problem,
        treeNodes
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
 * POST /api/problems
 * Create new problem
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const problem = await problemService.createProblem(req.body);

    // Generate tree nodes if tree_config is provided
    if (problem.tree_config) {
      const nodes = treeService.generateTreeNodes(problem.tree_config, problem.id);
      await problemService.saveTreeNodes(nodes);
    }

    const response: ApiResponse = {
      success: true,
      data: problem,
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/problems/:id
 * Update problem
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw createError('Invalid problem ID', 400);
    }

    const problem = await problemService.updateProblem(id, req.body);
    if (!problem) {
      throw createError('Problem not found', 404);
    }

    // Regenerate tree nodes if tree_config was updated
    if (req.body.tree_config) {
      const nodes = treeService.generateTreeNodes(req.body.tree_config, id);
      await problemService.saveTreeNodes(nodes);
    }

    const response: ApiResponse = {
      success: true,
      data: problem,
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
 * DELETE /api/problems/:id
 * Delete problem
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw createError('Invalid problem ID', 400);
    }

    const deleted = await problemService.deleteProblem(id);
    if (!deleted) {
      throw createError('Problem not found', 404);
    }

    const response: ApiResponse = {
      success: true,
      data: { deleted: true },
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
