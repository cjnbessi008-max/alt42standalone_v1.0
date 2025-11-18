/**
 * Vector Motion Types
 * 벡터 애니메이션을 위한 타입 정의
 */

export interface Vector2D {
  x: number;
  y: number;
}

export interface VectorArrowProps {
  /** 시작 위치 */
  start: Vector2D;
  /** 끝 위치 (또는 방향 벡터) */
  end: Vector2D;
  /** 화살표 색상 */
  color?: string;
  /** 화살표 두께 */
  strokeWidth?: number;
  /** 애니메이션 지속 시간 (ms) */
  duration?: number;
  /** 애니메이션 딜레이 (ms) */
  delay?: number;
  /** 애니메이션 활성화 여부 */
  animated?: boolean;
  /** 화살표 머리 크기 */
  arrowHeadSize?: number;
  /** 라벨 텍스트 */
  label?: string;
  /** 애니메이션 완료 콜백 */
  onAnimationComplete?: () => void;
}

export interface VectorFieldProps {
  /** 벡터 배열 */
  vectors: VectorArrowProps[];
  /** 캔버스 너비 */
  width: number;
  /** 캔버스 높이 */
  height: number;
  /** 배경색 */
  backgroundColor?: string;
  /** 격자 표시 여부 */
  showGrid?: boolean;
  /** 격자 간격 */
  gridSize?: number;
}

export interface AnimationState {
  /** 현재 진행도 (0-1) */
  progress: number;
  /** 애니메이션 실행 중 여부 */
  isPlaying: boolean;
  /** 현재 위치 */
  currentPosition: Vector2D;
  /** 현재 회전 각도 (라디안) */
  currentRotation: number;
}

export interface ProblemData {
  /** 문제 ID */
  id: string;
  /** 문제 제목 */
  title: string;
  /** 문제 설명 */
  description: string;
  /** 벡터 데이터 */
  vectors: VectorArrowProps[];
  /** 정답 */
  answer?: Vector2D;
  /** 문제 유형 */
  type: 'vector-addition' | 'vector-decomposition' | 'trajectory' | 'custom';
}

export type EasingFunction = (t: number) => number;
