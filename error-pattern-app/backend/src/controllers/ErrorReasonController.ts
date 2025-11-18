import { Request, Response } from 'express';
import { ErrorReasonService } from '../services/ErrorReasonService';
import { asyncHandler } from '../middleware/errorHandler';
import { ConfidenceLevel } from '../models';

const errorReasonService = new ErrorReasonService();

export const createErrorReason = asyncHandler(
  async (req: Request, res: Response) => {
    const { questionErrorId, categoryId, confidenceLevel, studentNote } =
      req.body;
    const userId = req.userId!;

    const errorReason = await errorReasonService.createErrorReason({
      questionErrorId,
      categoryId,
      userId,
      confidenceLevel: confidenceLevel as ConfidenceLevel,
      studentNote,
    });

    res.status(201).json({
      success: true,
      data: errorReason,
    });
  }
);

export const getMyErrorReasons = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;

    const errorReasons = await errorReasonService.getErrorReasonsByUser(userId);

    res.json({
      success: true,
      data: errorReasons,
      count: errorReasons.length,
    });
  }
);

export const getErrorReasonById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const errorReason = await errorReasonService.getErrorReasonById(
      parseInt(id)
    );

    res.json({
      success: true,
      data: errorReason,
    });
  }
);

export const updateErrorReason = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { categoryId, confidenceLevel, studentNote } = req.body;
    const userId = req.userId!;

    const errorReason = await errorReasonService.updateErrorReason(
      parseInt(id),
      userId,
      {
        categoryId,
        confidenceLevel: confidenceLevel as ConfidenceLevel,
        studentNote,
      }
    );

    res.json({
      success: true,
      data: errorReason,
    });
  }
);

export const deleteErrorReason = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.userId!;

    await errorReasonService.deleteErrorReason(parseInt(id), userId);

    res.json({
      success: true,
      message: 'Error reason deleted successfully',
    });
  }
);

export const getMyErrorStats = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const daysBack = parseInt(req.query.daysBack as string) || 30;

    const stats = await errorReasonService.getUserErrorStats(userId, daysBack);

    res.json({
      success: true,
      data: stats,
    });
  }
);
