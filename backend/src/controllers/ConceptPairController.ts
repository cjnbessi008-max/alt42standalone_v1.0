import { Request, Response } from 'express';
import ConceptPairModel from '../models/ConceptPairModel';
import WarningDetectionService from '../services/WarningDetectionService';
import {
  CreateConceptPairDTO,
  CheckWarningRequest,
  AcknowledgeWarningRequest,
  WarningEffectivenessUpdate,
  ConceptPairCategory
} from '../types';

export class ConceptPairController {
  /**
   * GET /api/concept-pairs
   * Get all active concept pairs
   */
  async getAllConceptPairs(req: Request, res: Response): Promise<void> {
    try {
      const { category, gradeLevel } = req.query;

      let conceptPairs;

      if (category) {
        conceptPairs = await ConceptPairModel.findByCategory(category as ConceptPairCategory);
      } else if (gradeLevel) {
        conceptPairs = await ConceptPairModel.findByGradeLevel(parseInt(gradeLevel as string));
      } else {
        conceptPairs = await ConceptPairModel.findAll();
      }

      res.json({
        success: true,
        data: conceptPairs,
        count: conceptPairs.length
      });
    } catch (error) {
      console.error('Error getting concept pairs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve concept pairs'
      });
    }
  }

  /**
   * GET /api/concept-pairs/:id
   * Get a specific concept pair by ID
   */
  async getConceptPairById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const conceptPair = await ConceptPairModel.findById(id);

      if (!conceptPair) {
        res.status(404).json({
          success: false,
          error: 'Concept pair not found'
        });
        return;
      }

      res.json({
        success: true,
        data: conceptPair
      });
    } catch (error) {
      console.error('Error getting concept pair:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve concept pair'
      });
    }
  }

  /**
   * POST /api/concept-pairs
   * Create a new concept pair
   */
  async createConceptPair(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateConceptPairDTO = req.body;

      // Validation would happen here (using Joi or similar)
      if (!data.conceptA || !data.conceptB || !data.category) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
        return;
      }

      const conceptPair = await ConceptPairModel.create(data);

      res.status(201).json({
        success: true,
        data: conceptPair
      });
    } catch (error) {
      console.error('Error creating concept pair:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create concept pair'
      });
    }
  }

  /**
   * POST /api/warnings/check
   * Check if student input triggers any warnings
   */
  async checkWarnings(req: Request, res: Response): Promise<void> {
    try {
      const request: CheckWarningRequest = req.body;

      // Validation
      if (!request.studentId || !request.inputText || !request.activityType) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: studentId, inputText, activityType'
        });
        return;
      }

      const result = await WarningDetectionService.checkForWarnings(request);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error checking warnings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check warnings'
      });
    }
  }

  /**
   * POST /api/warnings/:id/acknowledge
   * Record student acknowledgment of a warning
   */
  async acknowledgeWarning(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { studentId, acknowledged, dismissed }: AcknowledgeWarningRequest = req.body;

      // Validation
      if (!studentId || acknowledged === undefined) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: studentId, acknowledged'
        });
        return;
      }

      await WarningDetectionService.acknowledgeWarning(id, acknowledged, dismissed);

      res.json({
        success: true,
        message: 'Warning acknowledgment recorded'
      });
    } catch (error) {
      console.error('Error acknowledging warning:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to record acknowledgment'
      });
    }
  }

  /**
   * POST /api/warnings/:id/effectiveness
   * Update warning effectiveness metrics
   */
  async updateEffectiveness(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        correctedMistake,
        timeToCorrectionSeconds,
        followUpPerformanceImproved
      }: WarningEffectivenessUpdate = req.body;

      if (correctedMistake === undefined) {
        res.status(400).json({
          success: false,
          error: 'Missing required field: correctedMistake'
        });
        return;
      }

      await WarningDetectionService.updateWarningEffectiveness(
        id,
        correctedMistake,
        timeToCorrectionSeconds,
        followUpPerformanceImproved
      );

      res.json({
        success: true,
        message: 'Warning effectiveness updated'
      });
    } catch (error) {
      console.error('Error updating effectiveness:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update effectiveness'
      });
    }
  }

  /**
   * GET /api/concept-pairs/:id/statistics
   * Get statistics for a concept pair
   */
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { days } = req.query;

      const statistics = await WarningDetectionService.getWarningStatistics(
        id,
        days ? parseInt(days as string) : 30
      );

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('Error getting statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve statistics'
      });
    }
  }
}

export default new ConceptPairController();
