export interface OverthinkingScore {
  total: number;
  confidence: 'low' | 'medium' | 'high';
  triggers: string[];
  recommendation: 'observe' | 'hint' | 'alert_teacher';
}

export interface BehaviorEventData {
  studentId: string;
  problemId: string;
  attemptId?: string;
  eventType: 'click' | 'input_change' | 'focus' | 'blur' | 'scroll' | 'hover' | 'answer_modify';
  eventData?: Record<string, any>;
  timestamp?: Date;
}

export interface OverthinkingAnalysis {
  timeSpent: number;
  avgTime: number;
  answerModifications: number;
  inactivityDuration: number;
  repetitiveClicks: number;
  consecutiveErrors: number;
}

export interface HintLevel {
  level: number;
  text: string;
  helpfulness?: number;
}

export interface StudentAttemptData {
  studentId: string;
  problemId: string;
  startedAt: Date;
  currentTimeSpent: number;
  answerModifications: number;
  lastActivityAt: Date;
}

export interface TeacherAlert {
  id: string;
  studentId: string;
  studentName: string;
  problemId: string;
  problemTitle: string;
  score: number;
  triggers: string[];
  timestamp: Date;
}
