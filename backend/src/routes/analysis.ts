/**
 * Analysis Routes
 * 확신 오답 분석 엔드포인트
 */

import express from 'express';
import { db } from '../index';
import { AnalysisService } from '../services/analysisService';
import { logger } from '../utils/logger';

const router = express.Router();
const analysisService = new AnalysisService(db);

/**
 * GET /api/analysis/student/:userId
 * 학생별 확신 오답 분석
 */
router.get('/student/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const confidenceThreshold = parseInt(req.query.threshold as string) || 4;

    const confidentWrongAnswers = await analysisService.getConfidentWrongAnswers(
      userId,
      confidenceThreshold
    );

    const conceptWeaknesses = await analysisService.getConceptWeaknesses(
      userId,
      confidenceThreshold
    );

    const confidenceAccuracy = await analysisService.getConfidenceAccuracy(userId);

    res.json({
      userId,
      summary: {
        totalConfidentWrongAnswers: confidentWrongAnswers.length,
        weakConceptsCount: conceptWeaknesses.length,
      },
      confidentWrongAnswers,
      conceptWeaknesses,
      confidenceAccuracy,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analysis/class/:courseId
 * 학급 전체 확신 오답 분석
 */
router.get('/class/:courseId', async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const confidenceThreshold = parseInt(req.query.threshold as string) || 4;

    const classStats = await analysisService.getClassConfidentWrongStats(
      courseId,
      confidenceThreshold
    );

    res.json({
      courseId,
      confidenceThreshold,
      studentsAnalyzed: classStats.length,
      students: classStats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analysis/concepts/:userId
 * 개념별 취약점 분석
 */
router.get('/concepts/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const confidenceThreshold = parseInt(req.query.threshold as string) || 4;

    const conceptWeaknesses = await analysisService.getConceptWeaknesses(
      userId,
      confidenceThreshold
    );

    res.json({
      userId,
      conceptWeaknesses,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/analysis/generate/:userId
 * AI 기반 분석 실행 (추후 Claude API 연동)
 */
router.post('/generate/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Get all confident wrong answers
    const confidentWrongAnswers = await analysisService.getConfidentWrongAnswers(userId, 4);

    // For each, generate AI analysis (placeholder)
    const analyses = [];

    for (const cwa of confidentWrongAnswers.slice(0, 5)) {
      // Limit to 5 for demo
      // TODO: Call Claude API for misconception analysis
      const mockAIAnalysis = {
        misconception: '개념적 이해 부족',
        rootCause: '기본 원리 미숙지',
        suggestedApproach: '기초 개념 복습 필요',
        confidenceScore: 0.75,
      };

      await analysisService.saveConfidentWrongAnalysis(
        cwa.id,
        mockAIAnalysis,
        'conceptual_misunderstanding',
        ['https://example.com/resource1'],
        5
      );

      analyses.push({
        questionId: cwa.questionId,
        analysis: mockAIAnalysis,
      });
    }

    res.json({
      userId,
      analyzedCount: analyses.length,
      analyses,
      message: 'AI analysis completed (using mock data for now)',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
