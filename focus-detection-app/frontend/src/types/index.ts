// 집중도 데이터 타입
export interface FocusData {
  timestamp: number;
  score: number; // 0-100
  faceDetected: boolean;
  gazeScore: number; // 0-100
  headPoseScore: number; // 0-100
  movementScore: number; // 0-100
  headPose?: {
    pitch: number;
    yaw: number;
    roll: number;
  };
  gazeDirection?: {
    x: number;
    y: number;
  };
}

// 학습 세션 타입
export interface Session {
  id: string;
  studentName: string;
  startTime: string;
  endTime?: string;
  duration?: number; // seconds
  averageFocus: number;
  focusDataPoints: FocusData[];
  status: 'active' | 'completed' | 'paused';
}

// 세션 통계
export interface SessionStats {
  totalDuration: number;
  averageFocus: number;
  highFocusTime: number; // > 70
  mediumFocusTime: number; // 40-70
  lowFocusTime: number; // < 40
  distractionCount: number;
  peakFocusTime: string;
  lowestFocusTime: string;
}

// 학생 정보
export interface Student {
  id: string;
  name: string;
  sessions: Session[];
  totalSessionCount: number;
  averageFocusScore: number;
  lastSessionDate?: string;
}

// 웹캠 설정
export interface WebcamConfig {
  width: number;
  height: number;
  fps: number;
  facingMode: 'user' | 'environment';
}

// MediaPipe 설정
export interface MediaPipeConfig {
  maxNumFaces: number;
  refineLandmarks: boolean;
  minDetectionConfidence: number;
  minTrackingConfidence: number;
}

// 집중도 임계값
export interface FocusThresholds {
  high: number; // >= 70
  medium: number; // >= 40
  low: number; // < 40
  distractionTimeout: number; // ms
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// WebSocket 메시지 타입
export type WebSocketMessage =
  | { type: 'focus-update'; data: FocusData }
  | { type: 'session-start'; sessionId: string }
  | { type: 'session-end'; sessionId: string }
  | { type: 'alert'; level: 'info' | 'warning' | 'error'; message: string };

// 차트 데이터 포인트
export interface ChartDataPoint {
  timestamp: string;
  score: number;
  label?: string;
}

// 교사 대시보드 데이터
export interface TeacherDashboardData {
  activeSessions: Session[];
  todaySessions: Session[];
  students: Student[];
  stats: {
    totalStudents: number;
    activeNow: number;
    averageFocusToday: number;
    totalSessionsToday: number;
  };
}
