import { Response } from 'express';
import { z } from 'zod';
import { ProblemType, Difficulty } from '@prisma/client';
import { AuthRequest } from '../types';
import { ProblemService } from '../services/problem.service';
import { sendSuccess, sendError } from '../utils/response';

const createProblemSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  topic: z.string().min(1, 'Topic is required'),
  difficulty: z.nativeEnum(Difficulty),
  question: z.string().min(1, 'Question is required'),
  type: z.nativeEnum(ProblemType),
  options: z.any().optional(),
  answer: z.string().min(1, 'Answer is required'),
  explanation: z.string().optional(),
  metadata: z.any().optional(),
});

const updateProblemSchema = createProblemSchema.partial();

const filterSchema = z.object({
  subject: z.string().optional(),
  topic: z.string().optional(),
  difficulty: z.nativeEnum(Difficulty).optional(),
  type: z.nativeEnum(ProblemType).optional(),
});

export class ProblemController {
  static async createProblem(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const validatedData = createProblemSchema.parse(req.body);

      const problem = await ProblemService.createProblem({
        ...validatedData,
        teacherId: req.user.id,
      });

      sendSuccess(res, problem, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendError(res, error.errors[0].message, 400, 'VALIDATION_ERROR');
        return;
      }
      if (error instanceof Error) {
        sendError(res, error.message, 400);
        return;
      }
      sendError(res, 'Failed to create problem', 500);
    }
  }

  static async getProblems(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const filters = filterSchema.parse(req.query);

      const teacherId = req.user.role === 'TEACHER' ? req.user.id : undefined;

      const problems = await ProblemService.getProblems(teacherId, filters);

      sendSuccess(res, problems);
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendError(res, error.errors[0].message, 400, 'VALIDATION_ERROR');
        return;
      }
      if (error instanceof Error) {
        sendError(res, error.message, 400);
        return;
      }
      sendError(res, 'Failed to fetch problems', 500);
    }
  }

  static async getProblemById(req: AuthRequest, res: Response) {
    try {
      const problemId = req.params.id;

      const problem = await ProblemService.getProblemById(problemId);

      sendSuccess(res, problem);
    } catch (error) {
      if (error instanceof Error) {
        sendError(res, error.message, 404);
        return;
      }
      sendError(res, 'Failed to fetch problem', 500);
    }
  }

  static async updateProblem(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const problemId = req.params.id;
      const validatedData = updateProblemSchema.parse(req.body);

      const problem = await ProblemService.updateProblem(
        problemId,
        req.user.id,
        validatedData
      );

      sendSuccess(res, problem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendError(res, error.errors[0].message, 400, 'VALIDATION_ERROR');
        return;
      }
      if (error instanceof Error) {
        sendError(res, error.message, 400);
        return;
      }
      sendError(res, 'Failed to update problem', 500);
    }
  }

  static async deleteProblem(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const problemId = req.params.id;

      const result = await ProblemService.deleteProblem(problemId, req.user.id);

      sendSuccess(res, result);
    } catch (error) {
      if (error instanceof Error) {
        sendError(res, error.message, 400);
        return;
      }
      sendError(res, 'Failed to delete problem', 500);
    }
  }

  static async getTeacherStats(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const stats = await ProblemService.getTeacherStats(req.user.id);

      sendSuccess(res, stats);
    } catch (error) {
      if (error instanceof Error) {
        sendError(res, error.message, 400);
        return;
      }
      sendError(res, 'Failed to fetch stats', 500);
    }
  }
}
