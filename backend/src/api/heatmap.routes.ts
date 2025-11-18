/**
 * Heatmap API Routes
 * Endpoints for concept understanding heatmap visualization
 */

import { Router, Request, Response } from 'express';
import { ConceptUnderstandingModel } from '../models/ConceptUnderstanding';

export function createHeatmapRouter(db: any): Router {
  const router = Router();
  const model = new ConceptUnderstandingModel(db);

  /**
   * GET /api/heatmap/:moduleId
   * Get heatmap data for a module
   * Query params:
   *   - studentIds: comma-separated list of student IDs (optional)
   */
  router.get('/:moduleId', async (req: Request, res: Response) => {
    try {
      const { moduleId } = req.params;
      const { studentIds } = req.query;

      let heatmapData;
      if (studentIds && typeof studentIds === 'string') {
        const ids = studentIds.split(',').map(id => id.trim());
        heatmapData = await model.getHeatmapDataForStudents(moduleId, ids);
      } else {
        heatmapData = await model.getHeatmapData(moduleId);
      }

      // Transform data into matrix format for easier frontend consumption
      const concepts = [...new Set(heatmapData.map(d => d.conceptName))];
      const students = [...new Set(heatmapData.map(d => d.studentId))];

      const matrix = students.map(studentId => {
        const studentData = heatmapData.filter(d => d.studentId === studentId);
        const scores = concepts.map(conceptName => {
          const item = studentData.find(d => d.conceptName === conceptName);
          return {
            conceptId: item?.conceptId || null,
            score: item?.understandingScore || 0,
            masteryLevel: item?.masteryLevel || 'not_started',
            attemptsCount: item?.attemptsCount || 0,
            lastInteractionAt: item?.lastInteractionAt || null
          };
        });
        return {
          studentId,
          scores
        };
      });

      res.json({
        success: true,
        data: {
          moduleId,
          concepts,
          students,
          matrix,
          raw: heatmapData
        }
      });
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch heatmap data',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/heatmap/:moduleId/concepts
   * Get all concepts for a module
   */
  router.get('/:moduleId/concepts', async (req: Request, res: Response) => {
    try {
      const { moduleId } = req.params;
      const concepts = await model.getConceptsByModule(moduleId);

      res.json({
        success: true,
        data: concepts
      });
    } catch (error) {
      console.error('Error fetching concepts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch concepts',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/heatmap/:moduleId/student/:studentId
   * Get understanding data for a specific student
   */
  router.get('/:moduleId/student/:studentId', async (req: Request, res: Response) => {
    try {
      const { moduleId, studentId } = req.params;
      const understanding = await model.getStudentUnderstanding(studentId, moduleId);
      const summary = await model.getStudentMasterySummary(studentId, moduleId);

      res.json({
        success: true,
        data: {
          studentId,
          moduleId,
          understanding,
          summary
        }
      });
    } catch (error) {
      console.error('Error fetching student understanding:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch student understanding',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/heatmap/:moduleId/interaction
   * Record a student interaction with a concept
   * Body: { studentId, conceptId, interactionType, isCorrect, score, timeSpentSeconds, metadata }
   */
  router.post('/:moduleId/interaction', async (req: Request, res: Response) => {
    try {
      const { moduleId } = req.params;
      const {
        studentId,
        conceptId,
        interactionType,
        isCorrect,
        score,
        timeSpentSeconds,
        metadata
      } = req.body;

      // Validate required fields
      if (!studentId || !conceptId || !interactionType) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: studentId, conceptId, interactionType'
        });
      }

      // Record the interaction
      const interaction = await model.recordInteraction({
        studentId,
        conceptId,
        moduleId,
        interactionType,
        isCorrect,
        score,
        timeSpentSeconds,
        metadata,
        interactionAt: new Date()
      });

      // Update understanding score if applicable
      let understanding = null;
      if (isCorrect !== undefined && timeSpentSeconds !== undefined) {
        understanding = await model.updateUnderstanding(
          studentId,
          conceptId,
          moduleId,
          isCorrect,
          timeSpentSeconds
        );
      }

      res.json({
        success: true,
        data: {
          interaction,
          understanding
        }
      });
    } catch (error) {
      console.error('Error recording interaction:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to record interaction',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/heatmap/:moduleId/analysis
   * Get concept difficulty analysis for a module
   */
  router.get('/:moduleId/analysis', async (req: Request, res: Response) => {
    try {
      const { moduleId } = req.params;
      const analysis = await model.getConceptDifficultyAnalysis(moduleId);

      // Calculate module-level statistics
      const totalConcepts = analysis.length;
      const avgScore = analysis.reduce((sum, c) => sum + c.avgUnderstandingScore, 0) / totalConcepts;
      const totalStudentsAttempted = Math.max(...analysis.map(c => c.studentsAttempted), 0);

      // Identify problematic concepts (low scores, high variability)
      const problematicConcepts = analysis
        .filter(c => c.avgUnderstandingScore < 60 || c.scoreStdDev > 25)
        .sort((a, b) => a.avgUnderstandingScore - b.avgUnderstandingScore);

      // Identify mastered concepts
      const masteredConcepts = analysis
        .filter(c => c.avgUnderstandingScore >= 80 && c.scoreStdDev < 15)
        .sort((a, b) => b.avgUnderstandingScore - a.avgUnderstandingScore);

      res.json({
        success: true,
        data: {
          moduleId,
          summary: {
            totalConcepts,
            avgScore,
            totalStudentsAttempted,
            problematicConceptsCount: problematicConcepts.length,
            masteredConceptsCount: masteredConcepts.length
          },
          concepts: analysis,
          problematicConcepts,
          masteredConcepts
        }
      });
    } catch (error) {
      console.error('Error fetching concept analysis:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch concept analysis',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}
