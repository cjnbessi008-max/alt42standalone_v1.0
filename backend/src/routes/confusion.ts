/**
 * Confusion tracking API routes
 */

import { Router, Request, Response } from 'express';
import { confusionStore } from '../models/confusionStore.js';
import { BehaviorMetrics } from '../types/confusion.js';

const router = Router();

/**
 * POST /api/confusion/metrics
 * Submit behavior metrics for confusion tracking
 */
router.post('/metrics', (req: Request, res: Response) => {
  try {
    const { studentId, conceptId, metrics } = req.body;

    if (!studentId || !conceptId || !metrics) {
      return res.status(400).json({
        error: 'Missing required fields: studentId, conceptId, metrics',
      });
    }

    const metricsWithDate: BehaviorMetrics = {
      ...metrics,
      timestamp: new Date(metrics.timestamp || Date.now()),
    };

    const state = confusionStore.updateStudentConfusion(
      studentId,
      conceptId,
      metricsWithDate
    );

    res.json(state);
  } catch (error) {
    console.error('Error submitting metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/confusion/student/:studentId
 * Get current student confusion state
 */
router.get('/student/:studentId', (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { moduleId } = req.query;

    if (!moduleId || typeof moduleId !== 'string') {
      return res.status(400).json({ error: 'Missing moduleId query parameter' });
    }

    const state = confusionStore.getStudentState(studentId, moduleId);
    res.json(state);
  } catch (error) {
    console.error('Error getting student confusion:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/confusion/concept/:conceptId
 * Get confusion for specific concept
 */
router.get('/concept/:conceptId', (req: Request, res: Response) => {
  try {
    const { conceptId } = req.params;
    const { studentId } = req.query;

    if (!studentId || typeof studentId !== 'string') {
      return res.status(400).json({ error: 'Missing studentId query parameter' });
    }

    const moduleId = 'module-fractions-01'; // In production, get from query
    const state = confusionStore.getStudentState(studentId, moduleId);
    const concept = state.conceptConfusion.find((c) => c.conceptId === conceptId);

    if (!concept) {
      return res.status(404).json({ error: 'Concept not found' });
    }

    res.json(concept);
  } catch (error) {
    console.error('Error getting concept confusion:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/confusion/classroom/:classId
 * Get classroom-wide confusion analytics
 */
router.get('/classroom/:classId', (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { moduleId } = req.query;

    // Mock classroom data
    const classroomConfusion = {
      classId,
      averageConfusion: 42,
      distribution: {
        VERY_LOW: 3,
        LOW: 5,
        MEDIUM: 8,
        HIGH: 4,
        VERY_HIGH: 2,
      },
      studentsNeedingHelp: [],
      difficultConcepts: [],
      timestamp: new Date(),
    };

    res.json(classroomConfusion);
  } catch (error) {
    console.error('Error getting classroom confusion:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/confusion/history/:studentId
 * Get confusion history for student
 */
router.get('/history/:studentId', (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    const moduleId = 'module-fractions-01';
    const state = confusionStore.getStudentState(studentId, moduleId);

    let history = state.confusionHistory;

    // Filter by date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      history = history.filter(
        (h) => h.timestamp >= start && h.timestamp <= end
      );
    }

    res.json(history);
  } catch (error) {
    console.error('Error getting confusion history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
