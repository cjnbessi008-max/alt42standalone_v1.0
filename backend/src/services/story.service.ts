import prisma from '../config/database';
import { ClaudeService } from './claude.service';

interface GenerateStoryInput {
  problemId: string;
  theme?: string;
}

export class StoryService {
  static async generateStory(input: GenerateStoryInput) {
    const startTime = Date.now();

    // Get problem details
    const problem = await prisma.problem.findUnique({
      where: { id: input.problemId },
    });

    if (!problem) {
      throw new Error('Problem not found');
    }

    // Generate story using Claude API
    const storyData = await ClaudeService.generateStory({
      subject: problem.subject,
      topic: problem.topic,
      question: problem.question,
      type: problem.type,
      options: problem.options,
      answer: problem.answer,
      explanation: problem.explanation || undefined,
      difficulty: problem.difficulty,
      theme: input.theme || 'realistic',
    });

    const generationTime = Date.now() - startTime;

    // Save story to database
    const story = await prisma.story.create({
      data: {
        problemId: input.problemId,
        title: storyData.title,
        storyData: storyData as any,
        theme: input.theme || 'realistic',
        generationTime,
      },
      include: {
        problem: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return story;
  }

  static async getStoryById(storyId: string) {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        problem: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!story) {
      throw new Error('Story not found');
    }

    return story;
  }

  static async getStoriesByProblem(problemId: string) {
    const stories = await prisma.story.findMany({
      where: { problemId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return stories;
  }

  static async getStories(filters?: {
    teacherId?: string;
    theme?: string;
  }) {
    const where: any = {};

    if (filters?.theme) {
      where.theme = filters.theme;
    }

    if (filters?.teacherId) {
      where.problem = {
        teacherId: filters.teacherId,
      };
    }

    const stories = await prisma.story.findMany({
      where,
      include: {
        problem: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return stories;
  }

  static async regenerateStory(storyId: string, theme?: string) {
    const existingStory = await prisma.story.findUnique({
      where: { id: storyId },
      include: { problem: true },
    });

    if (!existingStory) {
      throw new Error('Story not found');
    }

    const startTime = Date.now();

    // Generate new story
    const storyData = await ClaudeService.generateStory({
      subject: existingStory.problem.subject,
      topic: existingStory.problem.topic,
      question: existingStory.problem.question,
      type: existingStory.problem.type,
      options: existingStory.problem.options,
      answer: existingStory.problem.answer,
      explanation: existingStory.problem.explanation || undefined,
      difficulty: existingStory.problem.difficulty,
      theme: theme || existingStory.theme,
    });

    const generationTime = Date.now() - startTime;

    // Update story
    const updatedStory = await prisma.story.update({
      where: { id: storyId },
      data: {
        title: storyData.title,
        storyData: storyData as any,
        theme: theme || existingStory.theme,
        generationTime,
      },
      include: {
        problem: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return updatedStory;
  }

  static async deleteStory(storyId: string, teacherId: string) {
    // Verify ownership through problem
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: { problem: true },
    });

    if (!story) {
      throw new Error('Story not found');
    }

    if (story.problem.teacherId !== teacherId) {
      throw new Error('Unauthorized: You can only delete stories from your own problems');
    }

    await prisma.story.delete({
      where: { id: storyId },
    });

    return { message: 'Story deleted successfully' };
  }
}
