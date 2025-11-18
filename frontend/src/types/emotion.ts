/**
 * Emotion Refresh Routine - TypeScript Types
 * ===========================================
 * Type definitions for emotion tracking and refresh routines
 */

// Emotion types
export enum EmotionType {
  HAPPY = 'happy',
  STRESSED = 'stressed',
  TIRED = 'tired',
  BORED = 'bored',
  FRUSTRATED = 'frustrated',
  FOCUSED = 'focused',
  ANXIOUS = 'anxious',
}

// Activity types
export enum ActivityType {
  BREATHING = 'breathing',
  STRETCH = 'stretch',
  MINDFULNESS = 'mindfulness',
  ENERGY = 'energy',
}

// Visual cues for animations
export enum VisualCue {
  RELAX = 'relax',
  INHALE = 'inhale',
  EXHALE = 'exhale',
  HOLD = 'hold',
  STRETCH = 'stretch',
  FOCUS = 'focus',
}

// Student rating
export enum StudentRating {
  THUMBS_DOWN = -1,
  NEUTRAL = 0,
  THUMBS_UP = 1,
}

// Emotion labels (Korean)
export const EMOTION_LABELS: Record<EmotionType, string> = {
  [EmotionType.HAPPY]: '행복',
  [EmotionType.STRESSED]: '스트레스',
  [EmotionType.TIRED]: '피곤',
  [EmotionType.BORED]: '지루함',
  [EmotionType.FRUSTRATED]: '화남',
  [EmotionType.FOCUSED]: '집중',
  [EmotionType.ANXIOUS]: '불안',
};

// Emotion icons
export const EMOTION_ICONS: Record<EmotionType, string> = {
  [EmotionType.HAPPY]: '😊',
  [EmotionType.STRESSED]: '😰',
  [EmotionType.TIRED]: '😓',
  [EmotionType.BORED]: '😐',
  [EmotionType.FRUSTRATED]: '😡',
  [EmotionType.FOCUSED]: '🎯',
  [EmotionType.ANXIOUS]: '😟',
};

// Activity type labels
export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  [ActivityType.BREATHING]: '호흡 운동',
  [ActivityType.STRETCH]: '스트레칭',
  [ActivityType.MINDFULNESS]: '마인드풀니스',
  [ActivityType.ENERGY]: '에너지 부스트',
};

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface EmotionCheckInRequest {
  student_id: string;
  module_id?: string;
  emotion_type: EmotionType;
  emotion_score: number; // 1-10
  context_note?: string;
  session_duration_minutes?: number;
}

export interface EmotionCheckInResponse {
  check_in_id: string;
  suggested_activity_id?: string;
  message: string;
  timestamp: string;
}

export interface GenerateActivityRequest {
  student_id: string;
  check_in_id?: string;
  emotion_type: EmotionType;
  emotion_score: number;
  grade_level: number;
  subject?: string;
  preferences?: {
    preferred_activities?: string[];
    avoid_activities?: string[];
  };
}

export interface ActivityStep {
  time_seconds: number;
  instruction: string;
  duration_seconds: number;
  visual_cue: VisualCue;
}

export interface ActivityContent {
  title: string;
  description: string;
  activity_type: ActivityType;
  steps: ActivityStep[];
  total_duration: number;
  background_music?: string;
  visual_guide?: string;
  expected_outcome: string;
  encouragement: string;
}

export interface GenerateActivityResponse {
  activity_id: string;
  session_id: string;
  activity: ActivityContent;
}

export interface CompleteSessionRequest {
  session_id: string;
  post_emotion_type: EmotionType;
  post_emotion_score: number;
  completed: boolean;
  completion_percentage?: number;
  student_rating?: StudentRating;
  feedback_note?: string;
  actual_duration_seconds?: number;
}

export interface CompleteSessionResponse {
  session_id: string;
  improvement_score: number;
  message: string;
  badges: string[];
}

export interface EmotionTrendPoint {
  date: string;
  avg_score: number;
  check_ins: number;
  most_common_emotion?: EmotionType;
}

export interface StudentEmotionHistoryResponse {
  student_id: string;
  date_range: {
    start: string;
    end: string;
  };
  emotion_trend: EmotionTrendPoint[];
  most_common_emotion: EmotionType;
  total_refresh_sessions: number;
  avg_improvement: number;
  total_check_ins: number;
}

export interface EmotionAnalyticsResponse {
  module_id: string;
  date: string;
  total_students: number;
  total_check_ins: number;
  avg_emotion_score: number;
  emotion_distribution: Record<string, number>;
  refresh_participation_rate: number;
  avg_improvement_score: number;
  correlation_with_performance?: number;
  top_activities: Array<{
    activity_id: string;
    title: string;
    activity_type: string;
    usage_count: number;
    avg_improvement: number;
  }>;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface EmotionCheckInWidgetProps {
  studentId: string;
  moduleId?: string;
  onCheckInComplete?: (response: EmotionCheckInResponse) => void;
  onActivitySuggested?: (activityId: string) => void;
}

export interface EmotionSelectorProps {
  selectedEmotion?: EmotionType;
  onSelect: (emotion: EmotionType) => void;
  disabled?: boolean;
}

export interface EmotionScoreSliderProps {
  score: number;
  onScoreChange: (score: number) => void;
  disabled?: boolean;
}

export interface RefreshActivityPlayerProps {
  activity: ActivityContent;
  sessionId: string;
  studentId: string;
  preEmotionType: EmotionType;
  preEmotionScore: number;
  onComplete: (response: CompleteSessionResponse) => void;
  onClose: () => void;
}

export interface ActivityStepDisplayProps {
  step: ActivityStep;
  isActive: boolean;
}

export interface EmotionFeedbackProps {
  preEmotion: EmotionType;
  preScore: number;
  postEmotion?: EmotionType;
  postScore?: number;
  onSubmit: (
    postEmotion: EmotionType,
    postScore: number,
    rating: StudentRating
  ) => void;
}

export interface StudentDashboardProps {
  studentId: string;
  days?: number;
}

export interface TeacherDashboardProps {
  moduleId: string;
  date?: string;
}

// ============================================================================
// State Management Types
// ============================================================================

export interface EmotionState {
  currentEmotion?: EmotionType;
  currentScore?: number;
  lastCheckIn?: EmotionCheckInResponse;
  activeSession?: {
    sessionId: string;
    activity: ActivityContent;
    startTime: number;
  };
  history: EmotionCheckInResponse[];
  loading: boolean;
  error?: string;
}

export interface EmotionActions {
  checkIn: (request: EmotionCheckInRequest) => Promise<EmotionCheckInResponse>;
  generateActivity: (
    request: GenerateActivityRequest
  ) => Promise<GenerateActivityResponse>;
  completeSession: (
    request: CompleteSessionRequest
  ) => Promise<CompleteSessionResponse>;
  getHistory: (studentId: string, days?: number) => Promise<StudentEmotionHistoryResponse>;
  clearError: () => void;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface ErrorResponse {
  error: string;
  detail?: string;
  timestamp: string;
}

export interface SuccessResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

// Timer state for activity player
export interface TimerState {
  currentTime: number; // seconds elapsed
  currentStepIndex: number;
  isPlaying: boolean;
  isPaused: boolean;
  isCompleted: boolean;
}
