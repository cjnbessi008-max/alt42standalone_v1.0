/**
 * LMS에서 받아오는 문제 정보 타입
 */
export interface ProblemData {
  id: string;
  title: string;
  type: 'overlap-sync' | 'fraction' | 'venn-diagram';
  shapes: ShapeConfig[];
  duration: number; // 애니메이션 지속 시간 (ms)
  targetOverlap: number; // 목표 겹침 비율 (0-1)
  difficulty: 'easy' | 'medium' | 'hard';
  instruction?: string;
}

/**
 * 도형 설정 타입
 */
export interface ShapeConfig {
  id: string;
  type: 'circle' | 'square' | 'triangle' | 'rectangle';
  color: string;
  size: number; // 크기 (px)
  startPosition: Position;
  endPosition: Position;
  opacity?: number;
  label?: string;
}

/**
 * 위치 타입
 */
export interface Position {
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
}

/**
 * 애니메이션 상태 타입
 */
export interface AnimationState {
  isPlaying: boolean;
  progress: number; // 0-1
  currentOverlap: number; // 0-1
  isPaused: boolean;
}

/**
 * LMS API 응답 타입 (Moodle 3.7+ 연동)
 */
export interface LMSResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: number;
}

/**
 * 사용자 진행 상태
 */
export interface UserProgress {
  userId: string;
  problemId: string;
  attempts: number;
  completed: boolean;
  score?: number;
  startedAt: number;
  completedAt?: number;
}
