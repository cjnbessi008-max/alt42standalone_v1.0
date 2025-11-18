/**
 * KTM Math Planet - Module Type Definitions
 */

import { PlanetProgress } from './planets';
import { WorldModel, Rule, DatabaseSchema, InputStrategy, UIGenerationResult, DeploymentStatus } from './pipeline';

export enum ModuleStatus {
  GENERATING = 'generating',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  FAILED = 'failed'
}

export interface Module {
  id: string;
  name: string;
  description: string;
  subject: 'mathematics' | 'science' | 'language';
  gradeLevel: string;
  teacherId: string;
  status: ModuleStatus;
  version: number;
  createdAt: string;
  updatedAt: string;

  // Pipeline data
  worldModel?: WorldModel;
  rules?: Rule[];
  schema?: DatabaseSchema;
  inputStrategy?: InputStrategy[];
  uiComponents?: UIGenerationResult;
  deploymentStatus?: DeploymentStatus;

  // Journey progress
  planetProgress: Record<number, PlanetProgress>;
  currentPlanet: number;
  overallProgress: number; // 0-100
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  institution: string;
  role: 'teacher' | 'admin' | 'system_maintainer';
  preferences: TeacherPreferences;
}

export interface TeacherPreferences {
  language: 'ko' | 'en';
  theme: 'light' | 'dark' | 'auto';
  enableAnimations: boolean;
  enableSounds: boolean;
  autoSave: boolean;
}

export interface ModuleListItem {
  id: string;
  name: string;
  status: ModuleStatus;
  currentPlanet: number;
  progress: number;
  updatedAt: string;
  studentCount?: number;
  completionRate?: number;
}

export interface ModuleAnalytics {
  moduleId: string;
  studentEngagement: {
    totalStudents: number;
    activeStudents: number;
    completionRate: number;
    averageScore: number;
  };
  performanceMetrics: {
    averageTimeSpent: number; // minutes
    problemsAttempted: number;
    problemsSolved: number;
    successRate: number;
  };
  timeline: TimelineDataPoint[];
}

export interface TimelineDataPoint {
  date: string;
  activeStudents: number;
  completions: number;
  averageScore: number;
}
