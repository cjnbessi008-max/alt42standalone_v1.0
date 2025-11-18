/**
 * Type definitions for Unit Compass application
 */

// Vector representation
export interface Vector {
  x: number;
  y: number;
  magnitude: number;
  angle: number; // in radians
}

// Unit vector (normalized)
export interface UnitVector extends Vector {
  magnitude: 1;
}

// Problem data from Moodle LMS
export interface Problem {
  id: string;
  title: string;
  description: string;
  type: ProblemType;
  targetAngle?: number; // Target angle for direction problems
  targetVector?: Vector; // Target vector for calculation problems
  difficulty: 'easy' | 'medium' | 'hard';
  hints?: string[];
  maxAttempts?: number;
}

export enum ProblemType {
  DIRECTION = 'direction', // Find direction to target angle
  MAGNITUDE = 'magnitude', // Calculate magnitude
  ADDITION = 'addition', // Vector addition
  SUBTRACTION = 'subtraction', // Vector subtraction
  NORMALIZATION = 'normalization' // Normalize vector to unit vector
}

// Student submission
export interface Submission {
  problemId: string;
  studentId: string;
  answer: Vector;
  timestamp: Date;
  isCorrect: boolean;
  attemptNumber: number;
}

// Student progress
export interface Progress {
  studentId: string;
  problemsSolved: number;
  totalProblems: number;
  accuracy: number;
  lastActivity: Date;
}

// Moodle API response
export interface MoodleResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}

// Moodle session data
export interface MoodleSession {
  token: string;
  userId: string;
  courseId: string;
  activityId: string;
}
