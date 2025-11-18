/**
 * TypeScript types for Dropout Analysis
 */

export interface ContributingFactor {
  reason: string;
  confidence: number;
  evidence: Record<string, any>;
}

export interface DropoutRecommendation {
  ko: string;
  en: string;
  actions: string[];
}

export interface DropoutMetrics {
  total_duration_seconds: number;
  active_duration_seconds: number;
  idle_time_ratio: number;
  total_attempts: number;
  correct_attempts: number;
  accuracy_rate: number;
  accuracy_trend: number[];
  events_per_minute: number;
  avg_time_per_problem: number;
  consecutive_errors: number;
  max_consecutive_errors: number;
}

export interface DropoutAnalysis {
  id: string;
  session_id: string;
  student_id: string;
  module_id: string;
  dropout_point?: string;
  primary_reason: string;
  confidence: number;
  contributing_factors: ContributingFactor[];
  recommendations: DropoutRecommendation;
  metrics: DropoutMetrics;
  analyzed_at: string;
}

export interface CommonDropoutReason {
  reason: string;
  frequency: number;
}

export interface StudentLearningProfile {
  student_id: string;
  total_sessions: number;
  dropout_sessions: number;
  dropout_rate: number;
  common_reasons: CommonDropoutReason[];
  avg_session_duration_minutes?: number;
  preferred_time?: string;
  engagement_trend?: string;
  last_session_at?: string;
}

export interface StudentPattern {
  student_id: string;
  student_name: string;
  total_sessions: number;
  dropout_sessions: number;
  dropout_rate: number;
  common_reasons: CommonDropoutReason[];
  learning_profile: StudentLearningProfile;
  recent_dropouts: DropoutAnalysis[];
  recommendations: string[];
}

export interface DropoutHotspot {
  location: string;
  location_type?: string;
  dropout_count: number;
  common_reason: string;
  severity_score: number;
  avg_time_before_dropout_seconds?: number;
}

export interface ModuleAnalyticsSummary {
  module_id: string;
  module_name: string;
  total_sessions: number;
  dropout_sessions: number;
  dropout_rate: number;
  avg_session_duration_minutes?: number;
  dropout_hotspots: DropoutHotspot[];
  recommendations: string[];
}

export interface DashboardOverview {
  total_sessions: number;
  dropout_count: number;
  dropout_rate: number;
  avg_session_duration: number;
  period: string;
}

export interface StudentAtRisk {
  student_id: string;
  student_name: string;
  recent_dropout_count: number;
  dropout_rate: number;
  primary_concern: string;
}

export interface DashboardData {
  overview: DashboardOverview;
  hotspots: DropoutHotspot[];
  students_at_risk: StudentAtRisk[];
  dropout_trend: Array<{
    date: string;
    count: number;
    rate: number;
  }>;
}

// Reason display names
export const DROPOUT_REASON_LABELS: Record<string, { ko: string; en: string }> = {
  high_error_rate: {
    ko: '높은 오답률',
    en: 'High Error Rate'
  },
  rapid_decline: {
    ko: '급격한 성적 하락',
    en: 'Rapid Decline'
  },
  session_fatigue: {
    ko: '학습 피로',
    en: 'Session Fatigue'
  },
  decreased_interaction: {
    ko: '참여도 감소',
    en: 'Decreased Interaction'
  },
  quick_exits: {
    ko: '빠른 이탈',
    en: 'Quick Exits'
  },
  extended_pause: {
    ko: '긴 휴식 후 이탈',
    en: 'Extended Pause'
  },
  content_aversion: {
    ko: '콘텐츠 회피',
    en: 'Content Aversion'
  },
  unknown: {
    ko: '알 수 없음',
    en: 'Unknown'
  }
};
