import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { determineRelation } from '../utils/set-relations';

const prisma = new PrismaClient();

const responseSchema = z.object({
  problemId: z.number().int().positive(),
  selectedRelation: z.enum(['SUBSET', 'SUPERSET', 'EQUAL', 'DISJOINT', 'INTERSECT']),
  confidenceLevel: z.number().int().min(0).max(100),
  timeSpent: z.number().int().min(0),
});

export const submitResponse = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const data = responseSchema.parse(req.body);

    // Get problem
    const problem = await prisma.problem.findUnique({
      where: { id: data.problemId },
    });

    if (!problem) {
      throw new AppError('Problem not found', 404);
    }

    // Check if answer is correct
    const isCorrect = data.selectedRelation === problem.relationType;

    // Create response
    const response = await prisma.response.create({
      data: {
        userId: req.user.id,
        problemId: data.problemId,
        selectedRelation: data.selectedRelation,
        confidenceLevel: data.confidenceLevel,
        isCorrect,
        timeSpent: data.timeSpent,
      },
      include: {
        problem: {
          select: {
            title: true,
            setA: true,
            setB: true,
            relationType: true,
          },
        },
      },
    });

    // Update progress
    await updateUserProgress(req.user.id);

    res.status(201).json({
      success: true,
      data: {
        id: response.id,
        isCorrect,
        correctAnswer: problem.relationType,
        selectedAnswer: data.selectedRelation,
        confidenceLevel: data.confidenceLevel,
        timeSpent: data.timeSpent,
        submittedAt: response.submittedAt,
      },
      message: isCorrect ? 'Correct answer!' : 'Incorrect answer',
    });
  } catch (error) {
    next(error);
  }
};

export const getUserResponses = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    // Check authorization
    if (req.user?.id !== Number(userId) && req.user?.role !== 'ADMIN') {
      throw new AppError('Unauthorized', 403);
    }

    const responses = await prisma.response.findMany({
      where: { userId: Number(userId) },
      include: {
        problem: {
          select: {
            title: true,
            difficulty: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });

    const total = await prisma.response.count({
      where: { userId: Number(userId) },
    });

    res.json({
      success: true,
      data: {
        responses,
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + responses.length < total,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getResponseById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const response = await prisma.response.findUnique({
      where: { id: Number(id) },
      include: {
        problem: {
          select: {
            title: true,
            setA: true,
            setB: true,
            relationType: true,
            difficulty: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!response) {
      throw new AppError('Response not found', 404);
    }

    // Check authorization
    if (req.user?.id !== response.userId && req.user?.role !== 'ADMIN') {
      throw new AppError('Unauthorized', 403);
    }

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    next(error);
  }
};

async function updateUserProgress(userId: number) {
  const stats = await prisma.response.aggregate({
    where: { userId },
    _count: { id: true },
    _sum: {
      timeSpent: true,
    },
    _avg: {
      confidenceLevel: true,
    },
  });

  const correctCount = await prisma.response.count({
    where: { userId, isCorrect: true },
  });

  await prisma.progress.upsert({
    where: { userId },
    create: {
      userId,
      totalProblems: stats._count.id,
      correctAnswers: correctCount,
      averageConfidence: stats._avg.confidenceLevel || 0,
      totalTimeSpent: stats._sum.timeSpent || 0,
    },
    update: {
      totalProblems: stats._count.id,
      correctAnswers: correctCount,
      averageConfidence: stats._avg.confidenceLevel || 0,
      totalTimeSpent: stats._sum.timeSpent || 0,
      lastActivityAt: new Date(),
    },
  });
}
