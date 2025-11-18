// Shared type definitions for frontend

export enum ConceptPairCategory {
  OPERATIONS = 'operations',
  VALUES = 'values',
  PROPERTIES = 'properties',
  THEOREMS = 'theorems',
  REPRESENTATIONS = 'representations'
}

export enum WarningSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ConceptPair {
  id: string;
  conceptA: string;
  conceptAKr: string;
  conceptADescription?: string;
  conceptB: string;
  conceptBKr: string;
  conceptBDescription?: string;
  category: ConceptPairCategory;
  gradeLevelMin?: number;
  gradeLevelMax?: number;
  confusionReason: string;
  confusionReasonKr: string;
  warningMessage: string;
  warningMessageKr: string;
  severity: WarningSeverity;
  exampleA?: string;
  exampleB?: string;
  differentiationTip?: string;
  differentiationTipKr?: string;
  timesWarned: number;
  effectivenessScore: number;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConceptPairTrigger {
  id: string;
  conceptPairId: string;
  triggerType: string;
  triggerPattern: string;
  triggerContext?: Record<string, any>;
  minOccurrences: number;
  timeWindowMinutes?: number;
  isActive: boolean;
  createdAt: string;
}

export interface TriggeredWarning {
  conceptPair: ConceptPair;
  trigger: ConceptPairTrigger;
  warningId: string;
}

export interface CheckWarningResponse {
  warningsTriggered: TriggeredWarning[];
  shouldShowWarning: boolean;
}

export interface CheckWarningRequest {
  studentId: string;
  moduleId?: string;
  sessionId?: string;
  activityType: string;
  inputText: string;
  problemData?: Record<string, any>;
  language?: 'en' | 'kr';
}
