/**
 * TypeScript type definitions for Learning Analytics
 */

export type EventType =
  | 'problem_start'
  | 'input_focus'
  | 'input_blur'
  | 'input_change'
  | 'button_click'
  | 'pause_detected'
  | 'resume_detected'
  | 'hint_requested'
  | 'answer_submitted'
  | 'problem_completed';

export type SessionStatus = 'in_progress' | 'completed' | 'abandoned';

export type SegmentType = 'pause' | 'struggle' | 'exploration' | 'verification';

export interface ActivityEvent {
  id: string;
  session_id: string;
  event_type: EventType;
  event_data?: Record<string, any>;
  timestamp: string;
  time_since_start_ms: number;
}

export interface LearningSession {
  id: string;
  student_id: string;
  module_id: string;
  problem_id: string;
  started_at: string;
  completed_at?: string;
  total_time_seconds?: number;
  is_correct?: boolean;
  submitted_answer?: Record<string, any>;
  status: SessionStatus;
}

export interface DelaySegment {
  id?: string;
  start_time_ms: number;
  end_time_ms: number;
  duration_ms: number;
  segment_type: SegmentType;
  context?: Record<string, any>;
}

export interface ThinkingMetrics {
  cognitive_load: number;
  persistence: number;
  efficiency: number;
}

export interface PhaseBreakdown {
  phase: string;
  start_ms: number;
  end_ms: number;
  description: string;
}

export interface TimelineEvent {
  time_ms: number;
  event_type: EventType;
  data?: Record<string, any>;
}

export interface ThinkingFlowGraphData {
  session_id: string;
  timeline: TimelineEvent[];
  delay_segments: DelaySegment[];
  thinking_metrics: ThinkingMetrics;
  phase_breakdown: PhaseBreakdown[];
  recommendations: string[];
}

export interface StudentProgress {
  student_id: string;
  module_id?: string;
  total_sessions: number;
  completed_sessions: number;
  average_completion_time?: number;
  success_rate: number;
  average_cognitive_load?: number;
  average_persistence?: number;
  average_efficiency?: number;
  improvement_trend: 'improving' | 'stable' | 'needs_support';
}

export interface Problem {
  id: string;
  module_id: string;
  problem_type: string;
  title: string;
  content: Record<string, any>;
  difficulty_level: number;
  expected_time_seconds?: number;
}
