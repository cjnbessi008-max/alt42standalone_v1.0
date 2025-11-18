/**
 * Metacognition Mirror API Routes
 * Provides real-time metacognition state for students
 */

import { Router } from 'express';
import { MetacognitionService } from '../services/metacognitionService.js';
import { logger } from '../utils/logger.js';

const router = Router();
const metacognitionService = new MetacognitionService();

/**
 * GET /api/v1/metacognition/:studentId
 * Get current metacognition state for a student
 */
router.get('/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { moduleId, startDate, endDate } = req.query;

    const metacognitionState = await metacognitionService.getMetacognitionState({
      studentId,
      moduleId: moduleId as string | undefined,
      timeRange: startDate && endDate ? {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      } : undefined
    });

    res.json({
      success: true,
      data: metacognitionState
    });
  } catch (error: any) {
    logger.error('Error getting metacognition state:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/metacognition/:studentId/insights
 * Get learning insights for a student
 */
router.get('/:studentId/insights', async (req, res) => {
  try {
    const { studentId } = req.params;
    const insights = await metacognitionService.getLearningInsights(studentId);

    res.json({
      success: true,
      data: insights
    });
  } catch (error: any) {
    logger.error('Error getting learning insights:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/metacognition/:studentId/focus-analysis
 * Get focus analysis for a student
 */
router.get('/:studentId/focus-analysis', async (req, res) => {
  try {
    const { studentId } = req.params;
    const focusAnalysis = await metacognitionService.getFocusAnalysis(studentId);

    res.json({
      success: true,
      data: focusAnalysis
    });
  } catch (error: any) {
    logger.error('Error getting focus analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export { router as metacognitionRoutes };
