// Length Assist API Controller

import { Request, Response } from 'express';
import lengthAssistService from '../services/lengthAssistService.js';
import { ApiResponse } from '../types/index.js';

export class LengthAssistController {
  /**
   * GET /api/length-assist/problems
   * Get list of problems
   */
  async getProblems(req: Request, res: Response) {
    try {
      const { moduleId, difficulty, limit, offset } = req.query;

      if (!moduleId) {
        return res.status(400).json({
          success: false,
          error: 'moduleId is required',
        } as ApiResponse);
      }

      const problems = await lengthAssistService.getProblems(
        moduleId as string,
        difficulty ? parseInt(difficulty as string) : undefined,
        limit ? parseInt(limit as string) : 10,
        offset ? parseInt(offset as string) : 0
      );

      res.json({
        success: true,
        data: problems,
      } as ApiResponse);
    } catch (error) {
      console.error('Error getting problems:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get problems',
      } as ApiResponse);
    }
  }

  /**
   * GET /api/length-assist/problems/:id
   * Get a specific problem
   */
  async getProblem(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const problem = await lengthAssistService.getProblem(id);

      if (!problem) {
        return res.status(404).json({
          success: false,
          error: 'Problem not found',
        } as ApiResponse);
      }

      res.json({
        success: true,
        data: problem,
      } as ApiResponse);
    } catch (error) {
      console.error('Error getting problem:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get problem',
      } as ApiResponse);
    }
  }

  /**
   * POST /api/length-assist/next-problem
   * Get next problem for student
   */
  async getNextProblem(req: Request, res: Response) {
    try {
      const { studentId, moduleId } = req.body;

      if (!studentId || !moduleId) {
        return res.status(400).json({
          success: false,
          error: 'studentId and moduleId are required',
        } as ApiResponse);
      }

      const problem = await lengthAssistService.getNextProblem(studentId, moduleId);

      if (!problem) {
        return res.status(404).json({
          success: false,
          error: 'No problems available',
        } as ApiResponse);
      }

      res.json({
        success: true,
        data: problem,
      } as ApiResponse);
    } catch (error) {
      console.error('Error getting next problem:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get next problem',
      } as ApiResponse);
    }
  }

  /**
   * POST /api/length-assist/submit
   * Submit student answer
   */
  async submitAnswer(req: Request, res: Response) {
    try {
      const { problemId, studentId, measuredRatio, timeSpent, interactions } = req.body;

      if (!problemId || !studentId || measuredRatio === undefined) {
        return res.status(400).json({
          success: false,
          error: 'problemId, studentId, and measuredRatio are required',
        } as ApiResponse);
      }

      const { line1Length, line2Length, ratio } = measuredRatio;

      const result = await lengthAssistService.submitAnswer(
        problemId,
        studentId,
        ratio,
        line1Length,
        line2Length,
        timeSpent || 0,
        interactions || []
      );

      res.json({
        success: true,
        data: result,
      } as ApiResponse);
    } catch (error: any) {
      console.error('Error submitting answer:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to submit answer',
      } as ApiResponse);
    }
  }

  /**
   * GET /api/length-assist/progress/:studentId
   * Get student progress
   */
  async getProgress(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const { moduleId } = req.query;

      if (!moduleId) {
        return res.status(400).json({
          success: false,
          error: 'moduleId is required',
        } as ApiResponse);
      }

      const progress = await lengthAssistService.getProgress(studentId, moduleId as string);

      if (!progress) {
        return res.status(404).json({
          success: false,
          error: 'Progress not found',
        } as ApiResponse);
      }

      res.json({
        success: true,
        data: progress,
      } as ApiResponse);
    } catch (error) {
      console.error('Error getting progress:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get progress',
      } as ApiResponse);
    }
  }
}

export default new LengthAssistController();
