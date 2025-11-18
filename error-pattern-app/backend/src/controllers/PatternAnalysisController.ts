import { Request, Response } from 'express';
import { PatternAnalysisService } from '../services/PatternAnalysisService';
import { asyncHandler } from '../middleware/errorHandler';

const patternAnalysisService = new PatternAnalysisService();

export const getMyPattern = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const daysBack = parseInt(req.query.daysBack as string) || 30;

    const analysis = await patternAnalysisService.analyzeStudentPattern(
      userId,
      daysBack
    );

    res.json({
      success: true,
      data: analysis,
    });
  }
);

export const getStudentPattern = asyncHandler(
  async (req: Request, res: Response) => {
    const { studentId } = req.params;
    const daysBack = parseInt(req.query.daysBack as string) || 30;

    const analysis = await patternAnalysisService.analyzeStudentPattern(
      parseInt(studentId),
      daysBack
    );

    res.json({
      success: true,
      data: analysis,
    });
  }
);

export const compareStudents = asyncHandler(
  async (req: Request, res: Response) => {
    const { studentIds } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      res.status(400).json({
        success: false,
        error: 'studentIds array is required',
      });
      return;
    }

    const comparison = await patternAnalysisService.compareStudents(studentIds);

    res.json({
      success: true,
      data: comparison,
    });
  }
);
