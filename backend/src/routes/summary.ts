import { Router, Request, Response } from 'express';
import { MoodleService } from '../services/moodleService';
import { AIService } from '../services/aiService';
import { ApiResponse, SummaryRequest } from '../types';

const router = Router();
const moodleService = new MoodleService();
const aiService = new AIService();

/**
 * POST /api/summary/generate
 * Generate AI summary for a question
 * Body: { questionId: number } or { questionText: string, equations?: string[] }
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { questionId, questionText, equations, questionType }: SummaryRequest = req.body;

    let parsedProblem;

    // Fetch from Moodle if questionId provided
    if (questionId) {
      const moodleQuestion = await moodleService.getQuestion(questionId);

      if (!moodleQuestion) {
        const response: ApiResponse = {
          success: false,
          error: 'Question not found',
          timestamp: new Date().toISOString(),
        };
        return res.status(404).json(response);
      }

      parsedProblem = moodleService.parseQuestion(moodleQuestion);
    }
    // Use provided question text
    else if (questionText) {
      parsedProblem = {
        id: 0,
        type: questionType || 'custom',
        questionText: questionText,
        plainText: questionText,
        equations: equations || [],
        metadata: {},
      };
    } else {
      const response: ApiResponse = {
        success: false,
        error: 'Either questionId or questionText must be provided',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    // Generate AI summary
    const summary = await aiService.generateSummary(parsedProblem);

    const response: ApiResponse = {
      success: true,
      data: {
        problem: parsedProblem,
        summary: summary,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error('Error in /api/summary/generate:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate summary',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/summary/question/:id
 * Get question with AI summary (combined endpoint)
 */
router.get('/question/:id', async (req: Request, res: Response) => {
  try {
    const questionId = parseInt(req.params.id);

    if (isNaN(questionId)) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid question ID',
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    // Fetch and parse question
    const moodleQuestion = await moodleService.getQuestion(questionId);

    if (!moodleQuestion) {
      const response: ApiResponse = {
        success: false,
        error: 'Question not found',
        timestamp: new Date().toISOString(),
      };
      return res.status(404).json(response);
    }

    const parsedProblem = moodleService.parseQuestion(moodleQuestion);

    // Generate AI summary
    const summary = await aiService.generateSummary(parsedProblem);

    const response: ApiResponse = {
      success: true,
      data: {
        problem: parsedProblem,
        summary: summary,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error('Error in /api/summary/question/:id:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate summary',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/summary/test
 * Test AI service connection
 */
router.get('/test', async (req: Request, res: Response) => {
  try {
    const isConnected = await aiService.testConnection();

    const response: ApiResponse = {
      success: isConnected,
      data: {
        connected: isConnected,
        model: process.env.ANTHROPIC_MODEL,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error('Error in /api/summary/test:', error);
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
});

export default router;
