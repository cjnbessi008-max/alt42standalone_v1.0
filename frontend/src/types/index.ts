// Core type definitions for Wrong Move Alert System

export interface Problem {
  id: string;
  title: string;
  description: string;
  type: 'multiple_choice' | 'input' | 'drag_drop' | 'step_by_step';
  correctAnswer: string | string[];
  steps?: ProblemStep[];
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  gradeLevel: string;
}

export interface ProblemStep {
  id: string;
  order: number;
  description: string;
  expectedAction: string;
  validationRule: string;
}

export interface StudentInteraction {
  id: string;
  problemId: string;
  studentId: string;
  timestamp: Date;
  action: string;
  isCorrect: boolean;
  stepId?: string;
}

export interface WrongMoveEvent {
  id: string;
  timestamp: Date;
  problemId: string;
  stepId?: string;
  incorrectAction: string;
  expectedAction: string;
  severity: 'low' | 'medium' | 'high';
}

export interface CrackEffect {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  severity: 'low' | 'medium' | 'high';
  duration: number;
}

export interface MoodleIntegration {
  courseId: string;
  activityId: string;
  userId: string;
  sessionToken?: string;
}
