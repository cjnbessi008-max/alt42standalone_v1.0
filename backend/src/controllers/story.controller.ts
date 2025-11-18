import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../types';
import { StoryService } from '../services/story.service';
import { sendSuccess, sendError } from '../utils/response';

const generateStorySchema = z.object({
  problemId: z.string().uuid('Invalid problem ID'),
  theme: z.string().optional(),
});

const filterSchema = z.object({
  theme: z.string().optional(),
});

export class StoryController {
  static async generateStory(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const validatedData = generateStorySchema.parse(req.body);

      const story = await StoryService.generateStory(validatedData);

      sendSuccess(res, story, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendError(res, error.errors[0].message, 400, 'VALIDATION_ERROR');
        return;
      }
      if (error instanceof Error) {
        sendError(res, error.message, 400);
        return;
      }
      sendError(res, 'Failed to generate story', 500);
    }
  }

  static async getStories(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const filters = filterSchema.parse(req.query);

      const teacherId = req.user.role === 'TEACHER' ? req.user.id : undefined;

      const stories = await StoryService.getStories({
        ...filters,
        teacherId,
      });

      sendSuccess(res, stories);
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendError(res, error.errors[0].message, 400, 'VALIDATION_ERROR');
        return;
      }
      if (error instanceof Error) {
        sendError(res, error.message, 400);
        return;
      }
      sendError(res, 'Failed to fetch stories', 500);
    }
  }

  static async getStoryById(req: AuthRequest, res: Response) {
    try {
      const storyId = req.params.id;

      const story = await StoryService.getStoryById(storyId);

      sendSuccess(res, story);
    } catch (error) {
      if (error instanceof Error) {
        sendError(res, error.message, 404);
        return;
      }
      sendError(res, 'Failed to fetch story', 500);
    }
  }

  static async getStoriesByProblem(req: AuthRequest, res: Response) {
    try {
      const problemId = req.params.problemId;

      const stories = await StoryService.getStoriesByProblem(problemId);

      sendSuccess(res, stories);
    } catch (error) {
      if (error instanceof Error) {
        sendError(res, error.message, 400);
        return;
      }
      sendError(res, 'Failed to fetch stories', 500);
    }
  }

  static async regenerateStory(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const storyId = req.params.id;
      const { theme } = req.body;

      const story = await StoryService.regenerateStory(storyId, theme);

      sendSuccess(res, story);
    } catch (error) {
      if (error instanceof Error) {
        sendError(res, error.message, 400);
        return;
      }
      sendError(res, 'Failed to regenerate story', 500);
    }
  }

  static async deleteStory(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const storyId = req.params.id;

      const result = await StoryService.deleteStory(storyId, req.user.id);

      sendSuccess(res, result);
    } catch (error) {
      if (error instanceof Error) {
        sendError(res, error.message, 400);
        return;
      }
      sendError(res, 'Failed to delete story', 500);
    }
  }
}
