/**
 * 집중 추적 이벤트 타입
 */
export type FocusEventType =
  | 'focus_lost'
  | 'focus_regained'
  | 'idle_detected'
  | 'break_started'
  | 'break_completed'
  | 'break_skipped';

/**
 * 집중 추적 이벤트
 */
export interface FocusTrackingEvent {
  eventType: FocusEventType;
  timestamp: number;
  studentId: string;
  moduleId: string;
  sessionId: string;
  metadata?: {
    idleTime?: number;
    breakDuration?: number;
    breakActivityType?: string;
    pageUrl?: string;
    completed?: boolean;
  };
}

/**
 * 집중 통계
 */
export interface FocusStatistics {
  studentId: string;
  moduleId: string;
  sessionId: string;
  totalFocusTime: number;
  totalIdleTime: number;
  focusLostCount: number;
  breaksCompleted: number;
  breaksSkipped: number;
  averageBreakDuration: number;
  lastActivityTimestamp: number;
}

/**
 * 세션 상세 정보
 */
export interface SessionDetails {
  sessionId: string;
  studentId: string;
  moduleId: string;
  startedAt: number;
  endedAt: number;
  events: Array<{
    eventType: FocusEventType;
    timestamp: Date;
    metadata: Record<string, any>;
  }>;
}

/**
 * 일별 리포트
 */
export interface DailyReport {
  studentId: string;
  date: string;
  totalSessions: number;
  focusLostCount: number;
  breaksCompleted: number;
  breaksSkipped: number;
  averageBreakDuration: number;
}

/**
 * 모듈별 리포트
 */
export interface ModuleReport {
  moduleId: string;
  totalStudents: number;
  totalSessions: number;
  averageFocusLostPerSession: number;
  averageBreaksCompletedPerSession: number;
  focusLostStandardDeviation: number;
}
