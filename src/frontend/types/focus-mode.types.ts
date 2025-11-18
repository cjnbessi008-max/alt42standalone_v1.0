/**
 * Focus Mode Types
 * Type definitions for eye tracking and focus mode functionality
 */

export interface Point {
  x: number;
  y: number;
  z?: number;
}

export interface EyeLandmarks {
  left: Point[];
  right: Point[];
}

export interface BlinkEvent {
  timestamp: number;
  eye: 'left' | 'right' | 'both';
  duration: number; // milliseconds
}

export interface BlinkMetrics {
  totalBlinks: number;
  blinksPerMinute: number;
  averageBlinkDuration: number;
  lastBlinkTimestamp: number;
}

export type FocusState = 'focused' | 'normal' | 'distracted' | 'unknown';

export interface FocusMetrics {
  state: FocusState;
  blinksPerMinute: number;
  focusDuration: number; // seconds
  confidenceScore: number; // 0-1
}

export interface FocusSession {
  sessionId: string;
  userId: string;
  courseId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // seconds
  avgBlinkRate: number;
  focusScore: number; // 0-100
  metrics: BlinkMetrics[];
}

export interface FocusModeConfig {
  // Thresholds
  focusThreshold: number; // blinks per minute to enter focus mode
  unfocusThreshold: number; // blinks per minute to exit focus mode
  earThreshold: number; // Eye Aspect Ratio threshold for blink detection

  // Window settings
  windowSize: number; // seconds for moving average
  consecutiveFrames: number; // frames to confirm blink

  // Camera settings
  cameraEnabled: boolean;
  frameRate: number; // FPS for camera
  videoWidth: number;
  videoHeight: number;

  // Privacy settings
  sendMetricsToServer: boolean;
  metricsInterval: number; // seconds between server updates

  // UI settings
  showBlinkCounter: boolean;
  showFocusTimer: boolean;
  autoHideSidebar: boolean;
  suggestFullscreen: boolean;
}

export const DEFAULT_FOCUS_CONFIG: FocusModeConfig = {
  focusThreshold: 10,
  unfocusThreshold: 20,
  earThreshold: 0.2,
  windowSize: 60,
  consecutiveFrames: 2,
  cameraEnabled: true,
  frameRate: 30,
  videoWidth: 640,
  videoHeight: 480,
  sendMetricsToServer: true,
  metricsInterval: 10,
  showBlinkCounter: true,
  showFocusTimer: true,
  autoHideSidebar: true,
  suggestFullscreen: true,
};

export interface EyeTrackingState {
  isTracking: boolean;
  facesDetected: number;
  eyeLandmarks: EyeLandmarks | null;
  error: string | null;
}

export interface FocusModeCallbacks {
  onFocusStart?: (metrics: FocusMetrics) => void;
  onFocusEnd?: (metrics: FocusMetrics) => void;
  onBlinkDetected?: (event: BlinkEvent) => void;
  onMetricsUpdate?: (metrics: BlinkMetrics) => void;
  onError?: (error: Error) => void;
}
