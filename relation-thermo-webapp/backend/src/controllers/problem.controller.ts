import { Response, NextFunction } from 'express';
import { PrismaClient, RelationType } from '@prisma/client';
import { z } from 'zod';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

const problemSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  setA: z.array(z.number()),
  setB: z.array(z.number()),
  relationType: z.enum(['SUBSET', 'SUPERSET', 'EQUAL', 'DISJOINT', 'INTERSECT']),
  difficulty: z.number().int().min(1).max(5),
});

export const getProblems = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { difficulty, limit = 10, offset = 0 } = req.query;

    const where = {
      isActive: true,
      ...(difficulty && { difficulty: Number(difficulty) }),
    };

    const problems = await prisma.problem.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        setA: true,
        setB: true,
        difficulty: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });

    const total = await prisma.problem.count({ where });

    res.json({
      success: true,
      data: {
        problems,
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + problems.length < total,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProblemById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const problem = await prisma.problem.findUnique({
      where: { id: Number(id), isActive: true },
      select: {
        id: true,
        title: true,
        description: true,
        setA: true,
        setB: true,
        difficulty: true,
        createdAt: true,
      },
    });

    if (!problem) {
      throw new AppError('Problem not found', 404);
    }

    res.json({
      success: true,
      data: problem,
    });
  } catch (error) {
    next(error);
  }
};

export const createProblem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = problemSchema.parse(req.body);

    const problem = await prisma.problem.create({
      data: {
        ...data,
        setA: data.setA,
        setB: data.setB,
      },
      select: {
        id: true,
        title: true,
        description: true,
        setA: true,
        setB: true,
        relationType: true,
        difficulty: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      data: problem,
      message: 'Problem created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const updateProblem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = problemSchema.partial().parse(req.body);

    const problem = await prisma.problem.update({
      where: { id: Number(id) },
      data,
      select: {
        id: true,
        title: true,
        description: true,
        setA: true,
        setB: true,
        relationType: true,
        difficulty: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: problem,
      message: 'Problem updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProblem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await prisma.problem.update({
      where: { id: Number(id) },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: 'Problem deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
