import { ProblemType, Difficulty } from '@prisma/client';
import prisma from '../config/database';

interface CreateProblemInput {
  teacherId: string;
  subject: string;
  topic: string;
  difficulty: Difficulty;
  question: string;
  type: ProblemType;
  options?: any;
  answer: string;
  explanation?: string;
  metadata?: any;
}

interface UpdateProblemInput {
  subject?: string;
  topic?: string;
  difficulty?: Difficulty;
  question?: string;
  type?: ProblemType;
  options?: any;
  answer?: string;
  explanation?: string;
  metadata?: any;
}

export class ProblemService {
  static async createProblem(input: CreateProblemInput) {
    const problem = await prisma.problem.create({
      data: input,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return problem;
  }

  static async getProblemById(problemId: string) {
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        stories: {
          select: {
            id: true,
            title: true,
            theme: true,
            createdAt: true,
          },
        },
      },
    });

    if (!problem) {
      throw new Error('Problem not found');
    }

    return problem;
  }

  static async getProblems(teacherId?: string, filters?: {
    subject?: string;
    topic?: string;
    difficulty?: Difficulty;
    type?: ProblemType;
  }) {
    const where: any = {};

    if (teacherId) {
      where.teacherId = teacherId;
    }

    if (filters) {
      if (filters.subject) where.subject = filters.subject;
      if (filters.topic) where.topic = filters.topic;
      if (filters.difficulty) where.difficulty = filters.difficulty;
      if (filters.type) where.type = filters.type;
    }

    const problems = await prisma.problem.findMany({
      where,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        stories: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return problems;
  }

  static async updateProblem(problemId: string, teacherId: string, input: UpdateProblemInput) {
    // Verify ownership
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
    });

    if (!problem) {
      throw new Error('Problem not found');
    }

    if (problem.teacherId !== teacherId) {
      throw new Error('Unauthorized: You can only update your own problems');
    }

    const updated = await prisma.problem.update({
      where: { id: problemId },
      data: input,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return updated;
  }

  static async deleteProblem(problemId: string, teacherId: string) {
    // Verify ownership
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
    });

    if (!problem) {
      throw new Error('Problem not found');
    }

    if (problem.teacherId !== teacherId) {
      throw new Error('Unauthorized: You can only delete your own problems');
    }

    await prisma.problem.delete({
      where: { id: problemId },
    });

    return { message: 'Problem deleted successfully' };
  }

  static async getTeacherStats(teacherId: string) {
    const [totalProblems, totalStories, topicBreakdown] = await Promise.all([
      prisma.problem.count({
        where: { teacherId },
      }),
      prisma.story.count({
        where: {
          problem: {
            teacherId,
          },
        },
      }),
      prisma.problem.groupBy({
        by: ['topic'],
        where: { teacherId },
        _count: true,
      }),
    ]);

    return {
      totalProblems,
      totalStories,
      topicBreakdown: topicBreakdown.map((item) => ({
        topic: item.topic,
        count: item._count,
      })),
    };
  }
}
