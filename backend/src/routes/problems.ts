import { Router, Request, Response } from 'express';
import { ProblemModel } from '../models/Problem';
import { ApiResponse } from '../types';

const router = Router();

// GET /api/problems - Get all problems with optional filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { difficulty, category, active } = req.query;

    const filters: any = {};
    if (difficulty) filters.difficulty = parseInt(difficulty as string);
    if (category) filters.category = category as string;
    if (active !== undefined) filters.isActive = active === 'true';

    const problems = await ProblemModel.getAll(filters);

    const response: ApiResponse<typeof problems> = {
      success: true,
      data: problems,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching problems:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch problems',
    };
    res.status(500).json(response);
  }
});

// GET /api/problems/:id - Get a specific problem
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const problem = await ProblemModel.getById(id);

    if (!problem) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Problem not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<typeof problem> = {
      success: true,
      data: problem,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching problem:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch problem',
    };
    res.status(500).json(response);
  }
});

// GET /api/problems/:id/hints - Get problem with hints
router.get('/:id/hints', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const problemWithHints = await ProblemModel.getWithHints(id);

    if (!problemWithHints) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Problem not found',
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<typeof problemWithHints> = {
      success: true,
      data: problemWithHints,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching problem with hints:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch problem with hints',
    };
    res.status(500).json(response);
  }
});

// POST /api/problems - Create a new problem (teacher/admin only)
router.post('/', async (req: Request, res: Response) => {
  try {
    const problemData = req.body;

    // Validate required fields
    if (!problemData.title || !problemData.equation_left || !problemData.equation_right || !problemData.solution) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Missing required fields',
      };
      return res.status(400).json(response);
    }

    const problemId = await ProblemModel.create({
      ...problemData,
      difficulty_level: problemData.difficulty_level || 1,
      category: problemData.category || 'linear',
      max_steps: problemData.max_steps || 10,
      time_limit: problemData.time_limit || 300,
      is_active: problemData.is_active !== undefined ? problemData.is_active : true,
    });

    const response: ApiResponse<{ id: number }> = {
      success: true,
      data: { id: problemId },
      message: 'Problem created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating problem:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to create problem',
    };
    res.status(500).json(response);
  }
});

// GET /api/problems/difficulty/:level - Get problems by difficulty
router.get('/difficulty/:level', async (req: Request, res: Response) => {
  try {
    const level = parseInt(req.params.level);

    if (level < 1 || level > 4) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid difficulty level (must be 1-4)',
      };
      return res.status(400).json(response);
    }

    const problems = await ProblemModel.getByDifficulty(level);

    const response: ApiResponse<typeof problems> = {
      success: true,
      data: problems,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching problems by difficulty:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch problems',
    };
    res.status(500).json(response);
  }
});

export default router;
