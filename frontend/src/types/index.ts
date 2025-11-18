// User types
export enum Role {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

// Problem types
export enum ProblemType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  SHORT_ANSWER = 'SHORT_ANSWER',
  MATH = 'MATH',
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export interface Problem {
  id: string;
  subject: string;
  topic: string;
  difficulty: Difficulty;
  question: string;
  type: ProblemType;
  options?: any;
  answer: string;
  explanation?: string;
  createdAt: string;
  teacher?: {
    id: string;
    name: string;
    email: string;
  };
  stories?: StoryPreview[];
}

// Story types
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
  nextScene: string | null;
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

export interface Story {
  id: string;
  problemId: string;
  title: string;
  storyData: StoryData;
  theme: string;
  generationTime: number;
  createdAt: string;
  problem?: Problem;
  progress?: StudentProgress;
}

export interface StoryPreview {
  id: string;
  title: string;
  theme?: string;
  createdAt?: string;
}

// Student progress types
export interface StudentProgress {
  id: string;
  studentId: string;
  storyId: string;
  completed: boolean;
  isCorrect?: boolean;
  choicesMade: string[];
  timeSpent: number;
  attempts: number;
  createdAt: string;
}

// Analytics types
export interface StudentAnalytics {
  totalStories: number;
  completedStories: number;
  completionRate: number;
  averageAccuracy: number;
  totalTimeSpent: number;
  averageAttemptsPerStory: number;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

// Auth types
export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role?: Role;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Form types
export interface CreateProblemInput {
  subject: string;
  topic: string;
  difficulty: Difficulty;
  question: string;
  type: ProblemType;
  options?: any;
  answer: string;
  explanation?: string;
}

export interface GenerateStoryInput {
  problemId: string;
  theme?: string;
}
