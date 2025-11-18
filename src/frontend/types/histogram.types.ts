/**
 * 히스토그램 데이터 타입
 */
export interface HistogramData {
  label: string;
  value: number;
  color?: string;
}

/**
 * 히스토그램 설정
 */
export interface HistogramConfig {
  width: number;
  height: number;
  barSpacing: number;
  animationDuration: number;
  beatIntensity: number; // 0-1: 비트 애니메이션 강도
  beatFrequency: number; // Hz: 비트 주파수
}

/**
 * LMS 문제 데이터
 */
export interface ProblemData {
  id: number;
  questionText: string;
  histogramData: HistogramData[];
  correctAnswer?: string;
  options?: string[];
}

/**
 * 학생 응답 데이터
 */
export interface StudentResponse {
  problemId: number;
  answer: string;
  timestamp: number;
  timeSpent: number; // seconds
}

/**
 * 애니메이션 상태
 */
export interface AnimationState {
  isPlaying: boolean;
  currentBeat: number;
  phase: number; // 0-1: 비트 사이클의 위상
}
