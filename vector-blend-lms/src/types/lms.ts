/**
 * Vector Blend LMS - LMS Integration Type Definitions
 * Supports LTI (Learning Tools Interoperability) integration
 */

import type { ProblemProgress } from './problem';

export interface LMSContext {
  // LTI Launch parameters
  userId?: string;
  courseId?: string;
  resourceLinkId?: string;
  contextId?: string;

  // Student information
  studentName?: string;
  studentEmail?: string;

  // Assignment/Activity information
  assignmentId?: string;
  assignmentTitle?: string;

  // Return URL for grade passback
  returnUrl?: string;
  outcomeServiceUrl?: string;

  // Custom parameters
  customParams?: Record<string, string>;
}

export interface LMSGradeSubmission {
  userId: string;
  assignmentId: string;
  score: number; // 0-1 (percentage)
  timestamp: Date;
  problemProgress: ProblemProgress[];
}

export interface LMSApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface LMSConfig {
  apiEndpoint: string;
  consumerKey?: string;
  sharedSecret?: string;
  mockMode?: boolean; // For development/testing
}
