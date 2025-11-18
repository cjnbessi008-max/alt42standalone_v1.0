import express from 'express';
import { extractIntervals } from '../services/intervalExtractor.js';
import type { IntervalSummary, ApiResponse } from '../../../shared/types.js';

const router = express.Router();

// POST /api/intervals/extract - Extract intervals from question content
router.post('/extract', async (req, res) => {
  const { questionId, content } = req.body;

  if (!content) {
    const response: ApiResponse<never> = {
      success: false,
      error: 'Question content is required',
      timestamp: new Date().toISOString()
    };
    return res.status(400).json(response);
  }

  try {
    const summary = extractIntervals(questionId || 'unknown', content);

    const response: ApiResponse<IntervalSummary> = {
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    const response: ApiResponse<never> = {
      success: false,
      error: error instanceof Error ? error.message : 'Extraction failed',
      timestamp: new Date().toISOString()
    };
    res.status(500).json(response);
  }
});

export default router;
