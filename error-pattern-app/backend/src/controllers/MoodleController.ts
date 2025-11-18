import { Request, Response } from 'express';
import { MoodleService } from '../services/MoodleService';
import { asyncHandler } from '../middleware/errorHandler';

const moodleService = new MoodleService();

export const syncUsers = asyncHandler(async (req: Request, res: Response) => {
  const { userIds } = req.body;

  const count = await moodleService.syncUsers(userIds);

  res.json({
    success: true,
    message: `${count} users synced successfully`,
    count,
  });
});

export const syncQuizAttempts = asyncHandler(
  async (req: Request, res: Response) => {
    const { quizId } = req.body;

    if (!quizId) {
      res.status(400).json({
        success: false,
        error: 'quizId is required',
      });
      return;
    }

    const count = await moodleService.syncQuizAttempts(quizId);

    res.json({
      success: true,
      message: `${count} quiz attempts synced successfully`,
      count,
    });
  }
);

export const getPendingErrors = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;

    const errors = await moodleService.getPendingErrors(userId);

    res.json({
      success: true,
      data: errors,
      count: errors.length,
    });
  }
);

export const syncAll = asyncHandler(async (req: Request, res: Response) => {
  const result = await moodleService.syncAllQuizzes();

  res.json({
    success: true,
    message: 'Sync completed',
    data: result,
  });
});
