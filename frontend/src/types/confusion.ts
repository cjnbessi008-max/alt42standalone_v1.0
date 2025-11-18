/**
 * Confusion Level Types for LMS Integration
 *
 * This module defines types for tracking and visualizing student confusion levels
 * in real-time based on learning behavior analytics.
 */

/**
 * Confusion level ranges (0-100 scale)
 * - 0-20: Very Low (Green) - Student understands well
 * - 21-40: Low (Light Green) - Minor hesitation
 * - 41-60: Medium (Yellow) - Some confusion
 * - 61-80: High (Orange) - Significant confusion
 * - 81-100: Very High (Red) - Needs immediate help
 */
export type ConfusionLevel = number;

/**
 * Color representation for confusion levels
 */
export enum ConfusionColor {
  VERY_LOW = '#22c55e',      // Green
  LOW = '#84cc16',           // Light Green
  MEDIUM = '#eab308',        // Yellow
  HIGH = '#f97316',          // Orange
  VERY_HIGH = '#ef4444',     // Red
}

/**
 * Confusion level category
 */
export enum ConfusionCategory {
  VERY_LOW = 'VERY_LOW',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH',
}

/**
 * Behavioral metrics used to calculate confusion level
 */
export interface BehaviorMetrics {
  /** Time spent on current problem (seconds) */
  timeSpent: number;

  /** Number of attempts made */
  attemptCount: number;

  /** Whether the answer was correct */
  isCorrect: boolean;

  /** Time between interactions (seconds) - indicates hesitation */
  hesitationTime: number;

  /** Number of times help was requested */
  helpRequestCount: number;

  /** Mouse movement patterns (erratic = confused) */
  mouseMovementScore: number;

  /** Number of input changes before submission */
  inputChangeCount: number;

  /** Timestamp of the interaction */
  timestamp: Date;
}

/**
 * Confusion data for a specific problem/concept
 */
export interface ConceptConfusion {
  /** Unique concept identifier */
  conceptId: string;

  /** Concept name (e.g., "Fraction Addition") */
  conceptName: string;

  /** Current confusion level (0-100) */
  confusionLevel: ConfusionLevel;

  /** Confusion category */
  category: ConfusionCategory;

  /** Associated color for visualization */
  color: ConfusionColor;

  /** Behavior metrics contributing to this level */
  metrics: BehaviorMetrics;

  /** Historical confusion levels */
  history: ConfusionDataPoint[];
}

/**
 * Time-series data point for confusion tracking
 */
export interface ConfusionDataPoint {
  timestamp: Date;
  confusionLevel: ConfusionLevel;
  category: ConfusionCategory;
  conceptId: string;
}

/**
 * Student's overall confusion state
 */
export interface StudentConfusionState {
  /** Unique student identifier */
  studentId: string;

  /** Student name */
  studentName: string;

  /** Current module/lesson */
  moduleId: string;

  /** Overall confusion level across all concepts */
  overallConfusion: ConfusionLevel;

  /** Confusion by individual concepts */
  conceptConfusion: ConceptConfusion[];

  /** Time-series history */
  confusionHistory: ConfusionDataPoint[];

  /** Last updated timestamp */
  lastUpdated: Date;

  /** Alert flag - true if intervention needed */
  needsIntervention: boolean;
}

/**
 * Classroom-wide confusion analytics
 */
export interface ClassroomConfusion {
  /** Class/section identifier */
  classId: string;

  /** Average confusion level */
  averageConfusion: ConfusionLevel;

  /** Distribution of students by confusion category */
  distribution: Record<ConfusionCategory, number>;

  /** Students needing immediate help */
  studentsNeedingHelp: StudentConfusionState[];

  /** Most confusing concepts in the class */
  difficultConcepts: ConceptConfusion[];

  /** Timestamp */
  timestamp: Date;
}

/**
 * LMS integration data
 */
export interface LMSIntegrationData {
  /** LMS platform (e.g., "Canvas", "Moodle", "Blackboard") */
  platform: string;

  /** Course ID in LMS */
  courseId: string;

  /** Assignment/Activity ID */
  activityId: string;

  /** LMS user ID */
  lmsUserId: string;

  /** Session token for LMS API */
  sessionToken?: string;

  /** LTI launch data (if using LTI) */
  ltiData?: Record<string, unknown>;
}

/**
 * Real-time confusion event
 */
export interface ConfusionEvent {
  eventType: 'CONFUSION_INCREASE' | 'CONFUSION_DECREASE' | 'HELP_NEEDED' | 'MASTERY_ACHIEVED';
  studentId: string;
  conceptId: string;
  previousLevel: ConfusionLevel;
  currentLevel: ConfusionLevel;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Confusion calculation weights (configurable)
 */
export interface ConfusionWeights {
  timeSpent: number;          // Default: 0.25
  attemptCount: number;       // Default: 0.20
  incorrectness: number;      // Default: 0.20
  hesitation: number;         // Default: 0.15
  helpRequests: number;       // Default: 0.10
  mouseMovement: number;      // Default: 0.05
  inputChanges: number;       // Default: 0.05
}
