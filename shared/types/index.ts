/**
 * Shared TypeScript types for Metacognition Mirror System
 * Used across frontend and backend
 */

// ===== Student & Learning Activity Types =====

export interface Student {
  id: string;
  name: string;
  gradeLevel: string;
  enrolledModules: string[];
  createdAt: Date;
}

export interface LearningActivity {
  id: string;
  studentId: string;
  moduleId: string;
  activityType: ActivityType;
  activityName: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // seconds
  metadata: Record<string, any>;
}

export enum ActivityType {
  READING = 'reading',
  PROBLEM_SOLVING = 'problem_solving',
  VIDEO_WATCHING = 'video_watching',
  INTERACTIVE_EXERCISE = 'interactive_exercise',
  ASSESSMENT = 'assessment',
  REFLECTION = 'reflection'
}

// ===== Metacognition Mirror Types =====

export interface MetacognitionState {
  studentId: string;
  currentActivity: CurrentActivity | null;
  recentActivities: ActivitySummary[];
  focusLevel: FocusLevel;
  timeDistribution: TimeDistribution;
  learningPattern: LearningPattern;
  reflectionPrompts: ReflectionPrompt[];
  timestamp: Date;
}

export interface CurrentActivity {
  activityId: string;
  activityType: ActivityType;
  activityName: string;
  moduleName: string;
  startedAt: Date;
  elapsedTime: number; // seconds
  progress: number; // 0-100
  interactions: number;
  lastInteractionAt: Date;
}

export interface ActivitySummary {
  activityType: ActivityType;
  activityName: string;
  duration: number; // seconds
  completedAt: Date;
  outcome: 'completed' | 'abandoned' | 'in_progress';
}

export enum FocusLevel {
  HIGHLY_FOCUSED = 'highly_focused',
  FOCUSED = 'focused',
  MODERATELY_FOCUSED = 'moderately_focused',
  DISTRACTED = 'distracted',
  HIGHLY_DISTRACTED = 'highly_distracted'
}

export interface TimeDistribution {
  reading: number; // percentage
  problemSolving: number;
  videoWatching: number;
  interactiveExercise: number;
  assessment: number;
  reflection: number;
}

export interface LearningPattern {
  preferredLearningTime: string; // e.g., "morning", "afternoon", "evening"
  averageSessionDuration: number; // seconds
  attentionSpan: number; // seconds
  breakFrequency: number; // times per hour
  strengths: string[];
  areasForImprovement: string[];
}

export interface ReflectionPrompt {
  id: string;
  prompt: string;
  promptType: ReflectionPromptType;
  priority: 'high' | 'medium' | 'low';
  suggestedAction?: string;
}

export enum ReflectionPromptType {
  AWARENESS = 'awareness', // "지금 뭘 하고 있지?"
  UNDERSTANDING = 'understanding', // "이해하고 있니?"
  STRATEGY = 'strategy', // "더 나은 방법이 있을까?"
  PROGRESS = 'progress', // "잘 진행되고 있니?"
  ENGAGEMENT = 'engagement' // "집중하고 있니?"
}

// ===== Behavior Tracking Types =====

export interface BehaviorEvent {
  id: string;
  studentId: string;
  activityId: string;
  eventType: BehaviorEventType;
  eventData: Record<string, any>;
  timestamp: Date;
}

export enum BehaviorEventType {
  CLICK = 'click',
  SCROLL = 'scroll',
  INPUT = 'input',
  FOCUS_CHANGE = 'focus_change',
  TAB_SWITCH = 'tab_switch',
  PAUSE = 'pause',
  RESUME = 'resume',
  SUBMIT = 'submit',
  HELP_REQUEST = 'help_request'
}

// ===== LMS Integration Types =====

export interface LMSModule {
  id: string;
  name: string;
  description: string;
  subject: string;
  gradeLevel: string;
  teacherId: string;
  status: 'active' | 'archived' | 'draft';
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentProgress {
  studentId: string;
  moduleId: string;
  startedAt: Date;
  lastAccessedAt: Date;
  progressPercentage: number;
  completedActivities: number;
  totalActivities: number;
  timeSpent: number; // seconds
  averageScore?: number;
}

// ===== API Request/Response Types =====

export interface MetacognitionMirrorRequest {
  studentId: string;
  moduleId?: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
}

export interface MetacognitionMirrorResponse {
  success: boolean;
  data: MetacognitionState;
  error?: string;
}

export interface BehaviorTrackingRequest {
  studentId: string;
  activityId: string;
  events: BehaviorEvent[];
}

export interface BehaviorTrackingResponse {
  success: boolean;
  eventsRecorded: number;
  analysis?: {
    focusLevel: FocusLevel;
    recommendedAction?: string;
  };
}

// ===== WebSocket Event Types =====

export interface WebSocketEvent {
  type: WebSocketEventType;
  payload: any;
  timestamp: Date;
}

export enum WebSocketEventType {
  ACTIVITY_STARTED = 'activity_started',
  ACTIVITY_COMPLETED = 'activity_completed',
  BEHAVIOR_UPDATE = 'behavior_update',
  METACOGNITION_UPDATE = 'metacognition_update',
  FOCUS_ALERT = 'focus_alert',
  REFLECTION_PROMPT = 'reflection_prompt'
}

// ===== Analysis Engine Types =====

export interface FocusAnalysis {
  currentFocus: FocusLevel;
  focusHistory: FocusDataPoint[];
  averageFocusDuration: number;
  distractionEvents: number;
  recommendations: string[];
}

export interface FocusDataPoint {
  timestamp: Date;
  focusLevel: FocusLevel;
  activityType: ActivityType;
}

export interface LearningInsight {
  insightType: InsightType;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  actionable: boolean;
  suggestedActions: string[];
}

export enum InsightType {
  PATTERN_DETECTED = 'pattern_detected',
  ATTENTION_WARNING = 'attention_warning',
  STRENGTH_IDENTIFIED = 'strength_identified',
  IMPROVEMENT_OPPORTUNITY = 'improvement_opportunity',
  MILESTONE_ACHIEVED = 'milestone_achieved'
}
