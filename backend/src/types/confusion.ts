/**
 * Backend types for confusion tracking
 */

export interface BehaviorMetrics {
  timeSpent: number;
  attemptCount: number;
  isCorrect: boolean;
  hesitationTime: number;
  helpRequestCount: number;
  mouseMovementScore: number;
  inputChangeCount: number;
  timestamp: Date;
}

export interface StudentConfusionState {
  studentId: string;
  studentName: string;
  moduleId: string;
  overallConfusion: number;
  conceptConfusion: ConceptConfusion[];
  confusionHistory: ConfusionDataPoint[];
  lastUpdated: Date;
  needsIntervention: boolean;
}

export interface ConceptConfusion {
  conceptId: string;
  conceptName: string;
  confusionLevel: number;
  category: string;
  color: string;
  metrics: BehaviorMetrics;
  history: ConfusionDataPoint[];
}

export interface ConfusionDataPoint {
  timestamp: Date;
  confusionLevel: number;
  category: string;
  conceptId: string;
}

export interface LMSIntegrationData {
  platform: string;
  courseId: string;
  activityId: string;
  lmsUserId: string;
  sessionToken?: string;
  ltiData?: Record<string, unknown>;
}
