import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export const getUserStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    // Check authorization
    if (req.user?.id !== Number(userId) && req.user?.role !== 'ADMIN') {
      throw new AppError('Unauthorized', 403);
    }

    // Get progress
    const progress = await prisma.progress.findUnique({
      where: { userId: Number(userId) },
    });

    // Get recent responses
    const recentResponses = await prisma.response.findMany({
      where: { userId: Number(userId) },
      orderBy: { submittedAt: 'desc' },
      take: 10,
      include: {
        problem: {
          select: {
            title: true,
            difficulty: true,
          },
        },
      },
    });

    // Get accuracy by difficulty
    const responsesByDifficulty = await prisma.response.groupBy({
      by: ['isCorrect'],
      where: { userId: Number(userId) },
      _count: true,
    });

    const accuracy = progress
      ? (progress.correctAnswers / progress.totalProblems) * 100
      : 0;

    res.json({
      success: true,
      data: {
        progress: {
          totalProblems: progress?.totalProblems || 0,
          correctAnswers: progress?.correctAnswers || 0,
          accuracy: Math.round(accuracy * 100) / 100,
          averageConfidence: progress?.averageConfidence || 0,
          totalTimeSpent: progress?.totalTimeSpent || 0,
          lastActivityAt: progress?.lastActivityAt,
        },
        recentResponses,
        stats: {
          totalCorrect: responsesByDifficulty.find((r) => r.isCorrect)?._count || 0,
          totalIncorrect: responsesByDifficulty.find((r) => !r.isCorrect)?._count || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getOverallStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Total users
    const totalUsers = await prisma.user.count();

    // Total problems
    const totalProblems = await prisma.problem.count({ where: { isActive: true } });

    // Total responses
    const totalResponses = await prisma.response.count();

    // Average accuracy
    const responses = await prisma.response.findMany({
      select: { isCorrect: true },
    });
    const correctCount = responses.filter((r) => r.isCorrect).length;
    const overallAccuracy = responses.length > 0
      ? (correctCount / responses.length) * 100
      : 0;

    // Average confidence
    const avgConfidenceResult = await prisma.response.aggregate({
      _avg: { confidenceLevel: true },
    });

    // Recent activity
    const recentActivity = await prisma.response.findMany({
      orderBy: { submittedAt: 'desc' },
      take: 20,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        problem: {
          select: {
            title: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalProblems,
          totalResponses,
          overallAccuracy: Math.round(overallAccuracy * 100) / 100,
          averageConfidence: avgConfidenceResult._avg.confidenceLevel || 0,
        },
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};
