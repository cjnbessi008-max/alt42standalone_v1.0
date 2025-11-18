/**
 * Vector Blend LMS - Problem Type Definitions
 */

import type { RGB, Vector2D } from './vector';

export type ProblemType = 'vector-addition' | 'color-matching' | 'target-vector' | 'free-exploration';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Problem {
  id: string;
  type: ProblemType;
  difficulty: DifficultyLevel;
  title: string;
  description: string;
  instructions: string;

  // Initial vectors provided in the problem
  initialVectors: Vector2D[];

  // Success criteria
  targetColor?: RGB;
  targetVector?: Vector2D;
  colorTolerance?: number; // Acceptable difference in color values (0-255)
  vectorTolerance?: number; // Acceptable difference in vector magnitude

  // Hints and feedback
  hint?: string;
  successMessage?: string;

  // Metadata
  tags?: string[];
  estimatedTime?: number; // in seconds
}

export interface ProblemProgress {
  problemId: string;
  attempts: number;
  completed: boolean;
  timeSpent: number; // in seconds
  studentAnswer?: {
    resultVector: Vector2D;
    resultColor: RGB;
    timestamp: Date;
  };
}

export interface ProblemSet {
  id: string;
  title: string;
  description: string;
  problems: Problem[];
  requiredCompletions?: number; // How many problems must be completed
}
