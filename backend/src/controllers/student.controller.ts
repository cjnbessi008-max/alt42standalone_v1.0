import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../types';
import { StudentService } from '../services/student.service';
import { sendSuccess, sendError } from '../utils/response';

const startStorySchema = z.object({
  storyId: z.string().uuid('Invalid story ID'),
});

const completeStorySchema = z.object({
  choicesMade: z.array(z.string()),
  isCorrect: z.boolean(),
  timeSpent: z.number().min(0),
});

export class StudentController {
  static async getAvailableStories(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const stories = await StudentService.getAvailableStories(req.user.id);

      sendSuccess(res, stories);
    } catch (error) {
      if (error instanceof Error) {
        sendError(res, error.message, 400);
        return;
      }
      sendError(res, 'Failed to fetch stories', 500);
    }
  }

  static async startStory(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const validatedData = startStorySchema.parse(req.body);

      const result = await StudentService.startStory({
        studentId: req.user.id,
        storyId: validatedData.storyId,
      });

      sendSuccess(res, result, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendError(res, error.errors[0].message, 400, 'VALIDATION_ERROR');
        return;
      }
      if (error instanceof Error) {
        sendError(res, error.message, 400);
        return;
      }
      sendError(res, 'Failed to start story', 500);
    }
  }

  static async completeStory(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const storyId = req.params.storyId;
      const validatedData = completeStorySchema.parse(req.body);

      const result = await StudentService.completeStory({
        studentId: req.user.id,
        storyId,
        ...validatedData,
      });

      sendSuccess(res, result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendError(res, error.errors[0].message, 400, 'VALIDATION_ERROR');
        return;
      }
      if (error instanceof Error) {
        sendError(res, error.message, 400);
        return;
      }
      sendError(res, 'Failed to complete story', 500);
    }
  }

  static async getProgress(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const progress = await StudentService.getStudentProgress(req.user.id);

      sendSuccess(res, progress);
    } catch (error) {
      if (error instanceof Error) {
        sendError(res, error.message, 400);
        return;
      }
      sendError(res, 'Failed to fetch progress', 500);
    }
  }

  static async getAnalytics(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const analytics = await StudentService.getStudentAnalytics(req.user.id);

      sendSuccess(res, analytics);
    } catch (error) {
      if (error instanceof Error) {
        sendError(res, error.message, 400);
        return;
      }
      sendError(res, 'Failed to fetch analytics', 500);
    }
  }

  static async getStoryProgress(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const storyId = req.params.storyId;

      const progress = await StudentService.getStoryProgress(req.user.id, storyId);

      sendSuccess(res, progress);
    } catch (error) {
      if (error instanceof Error) {
        sendError(res, error.message, 400);
        return;
      }
      sendError(res, 'Failed to fetch story progress', 500);
    }
  }
}
