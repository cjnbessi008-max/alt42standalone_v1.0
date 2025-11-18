import { Request } from 'express';
import { Role } from '@prisma/client';

// Extend Express Request to include authenticated user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
  };
}

// Story structure types
export interface StoryCharacter {
  name: string;
  role: string;
  personality: string;
  avatar?: string;
}

export interface StoryChoice {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback: string;
  nextScene: string | null; // null means end of story
}

export interface StoryScene {
  id: string;
  dialogue: string;
  narration: string;
  image?: string;
  choices: StoryChoice[];
}

export interface StoryData {
  title: string;
  context: string;
  character: StoryCharacter;
  scenes: StoryScene[];
  originalProblem: {
    question: string;
    answer: string;
    explanation?: string;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

// Problem upload types
export interface ProblemCSVRow {
  subject: string;
  topic: string;
  difficulty: string;
  question: string;
  type: string;
  options?: string; // JSON string
  answer: string;
  explanation?: string;
}

// Analytics types
export interface StudentAnalytics {
  totalStories: number;
  completedStories: number;
  completionRate: number;
  averageAccuracy: number;
  totalTimeSpent: number; // seconds
  averageAttemptsPerStory: number;
}

export interface TeacherAnalytics {
  totalProblems: number;
  totalStories: number;
  totalStudents: number;
  averageCompletionRate: number;
  popularTopics: Array<{
    topic: string;
    count: number;
  }>;
}
