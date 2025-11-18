// 도형 좌표 타입
export interface Point {
  x: number;
  y: number;
}

// 도형 타입
export interface Shape {
  type: 'rectangle' | 'triangle' | 'circle' | 'polygon';
  points: Point[];
  color?: string;
}

// 문제 타입
export interface Problem {
  id: number;
  moodle_id?: number;
  title: string;
  description: string;
  original_shape: Shape;
  scale_range_min: number;
  scale_range_max: number;
  created_at?: string;
}

// 학습 진행도 타입
export interface UserProgress {
  id?: number;
  user_id: number;
  problem_id: number;
  scale_value: number;
  completed: boolean;
  score: number;
  created_at?: string;
}

// Scale Sound 설정 타입
export interface ScaleSoundConfig {
  enabled: boolean;
  baseFrequency: number;  // 기본 주파수 (Hz)
  minScale: number;        // 최소 배율
  maxScale: number;        // 최대 배율
  duration: number;        // 소리 지속 시간 (초)
  waveType: OscillatorType; // 파형 타입
}

// Moodle API 응답 타입
export interface MoodleApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
