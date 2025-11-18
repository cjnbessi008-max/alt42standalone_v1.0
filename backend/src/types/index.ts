// Type definitions for Concept Pair Warning System

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

export enum TriggerType {
  KEYWORD = 'keyword',
  PATTERN = 'pattern',
  CONTEXT = 'context',
  SEQUENCE = 'sequence'
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
  createdAt: Date;
  updatedAt: Date;
}

export interface ConceptPairTrigger {
  id: string;
  conceptPairId: string;
  triggerType: TriggerType;
  triggerPattern: string;
  triggerContext?: Record<string, any>;
  minOccurrences: number;
  timeWindowMinutes?: number;
  isActive: boolean;
  createdAt: Date;
}

export interface StudentConceptWarning {
  id: string;
  studentId: string;
  moduleId?: string;
  sessionId?: string;
  conceptPairId: string;
  triggerId?: string;
  activityType?: string;
  problemData?: Record<string, any>;
  warningShownAt: Date;
  studentAcknowledged: boolean;
  acknowledgedAt?: Date;
  studentDismissed: boolean;
  dismissedAt?: Date;
  studentCorrectedMistake?: boolean;
  timeToCorrectionSeconds?: number;
  followUpPerformanceImproved?: boolean;
  createdAt: Date;
}

export interface ConceptPairAnalytics {
  id: string;
  conceptPairId: string;
  analysisPeriod: 'daily' | 'weekly' | 'monthly';
  periodStart: Date;
  periodEnd: Date;
  totalWarningsShown: number;
  totalStudentsWarned: number;
  acknowledgmentRate?: number;
  correctionRate?: number;
  avgTimeToCorrectionSeconds?: number;
  preWarningErrorRate?: number;
  postWarningErrorRate?: number;
  effectivenessImprovement?: number;
  createdAt: Date;
}

// Request/Response DTOs
export interface CreateConceptPairDTO {
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
  severity?: WarningSeverity;
  exampleA?: string;
  exampleB?: string;
  differentiationTip?: string;
  differentiationTipKr?: string;
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

export interface CheckWarningResponse {
  warningsTriggered: Array<{
    conceptPair: ConceptPair;
    trigger: ConceptPairTrigger;
    warningId: string;
  }>;
  shouldShowWarning: boolean;
}

export interface AcknowledgeWarningRequest {
  warningId: string;
  studentId: string;
  acknowledged: boolean;
  dismissed?: boolean;
}

export interface WarningEffectivenessUpdate {
  warningId: string;
  correctedMistake: boolean;
  timeToCorrectionSeconds?: number;
  followUpPerformanceImproved?: boolean;
}
