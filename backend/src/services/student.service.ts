import prisma from '../config/database';
import { StudentAnalytics } from '../types';

interface StartStoryInput {
  studentId: string;
  storyId: string;
}

interface SubmitChoiceInput {
  studentId: string;
  storyId: string;
  choiceId: string;
  sceneId: string;
  isCorrect: boolean;
  timeSpent: number;
}

interface CompleteStoryInput {
  studentId: string;
  storyId: string;
  choicesMade: string[];
  isCorrect: boolean;
  timeSpent: number;
}

export class StudentService {
  static async getAvailableStories(studentId: string) {
    // For now, return all stories
    // In future, can filter by assigned stories
    const stories = await prisma.story.findMany({
      include: {
        problem: {
          select: {
            id: true,
            subject: true,
            topic: true,
            difficulty: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get student's progress for these stories
    const progressRecords = await prisma.studentProgress.findMany({
      where: {
        studentId,
        storyId: {
          in: stories.map((s) => s.id),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      distinct: ['storyId'],
    });

    const progressMap = new Map(progressRecords.map((p) => [p.storyId, p]));

    return stories.map((story) => ({
      ...story,
      progress: progressMap.get(story.id) || null,
    }));
  }

  static async startStory(input: StartStoryInput) {
    // Check if story exists
    const story = await prisma.story.findUnique({
      where: { id: input.storyId },
    });

    if (!story) {
      throw new Error('Story not found');
    }

    // Create initial progress record
    const progress = await prisma.studentProgress.create({
      data: {
        studentId: input.studentId,
        storyId: input.storyId,
        completed: false,
        choicesMade: [],
        timeSpent: 0,
        attempts: 1,
      },
    });

    return {
      progress,
      story,
    };
  }

  static async completeStory(input: CompleteStoryInput) {
    // Find the most recent progress record for this story
    const existingProgress = await prisma.studentProgress.findFirst({
      where: {
        studentId: input.studentId,
        storyId: input.storyId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    let progress;

    if (existingProgress && !existingProgress.completed) {
      // Update existing progress
      progress = await prisma.studentProgress.update({
        where: { id: existingProgress.id },
        data: {
          completed: true,
          isCorrect: input.isCorrect,
          choicesMade: input.choicesMade,
          timeSpent: input.timeSpent,
        },
      });
    } else {
      // Create new progress record (retry attempt)
      const attempts = existingProgress ? existingProgress.attempts + 1 : 1;
      progress = await prisma.studentProgress.create({
        data: {
          studentId: input.studentId,
          storyId: input.storyId,
          completed: true,
          isCorrect: input.isCorrect,
          choicesMade: input.choicesMade,
          timeSpent: input.timeSpent,
          attempts,
        },
      });
    }

    return progress;
  }

  static async getStudentProgress(studentId: string) {
    const allProgress = await prisma.studentProgress.findMany({
      where: { studentId },
      include: {
        story: {
          include: {
            problem: {
              select: {
                subject: true,
                topic: true,
                difficulty: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return allProgress;
  }

  static async getStudentAnalytics(studentId: string): Promise<StudentAnalytics> {
    const allProgress = await prisma.studentProgress.findMany({
      where: { studentId },
    });

    const uniqueStories = new Set(allProgress.map((p) => p.storyId));
    const completedStories = allProgress.filter((p) => p.completed);
    const uniqueCompletedStories = new Set(completedStories.map((p) => p.storyId));

    const correctAnswers = completedStories.filter((p) => p.isCorrect).length;
    const totalCompleted = completedStories.length;

    const totalTimeSpent = allProgress.reduce((sum, p) => sum + p.timeSpent, 0);
    const totalAttempts = allProgress.reduce((sum, p) => sum + p.attempts, 0);

    return {
      totalStories: uniqueStories.size,
      completedStories: uniqueCompletedStories.size,
      completionRate: uniqueStories.size > 0
        ? (uniqueCompletedStories.size / uniqueStories.size) * 100
        : 0,
      averageAccuracy: totalCompleted > 0
        ? (correctAnswers / totalCompleted) * 100
        : 0,
      totalTimeSpent,
      averageAttemptsPerStory: uniqueStories.size > 0
        ? totalAttempts / uniqueStories.size
        : 0,
    };
  }

  static async getStoryProgress(studentId: string, storyId: string) {
    const progressRecords = await prisma.studentProgress.findMany({
      where: {
        studentId,
        storyId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return progressRecords;
  }
}
