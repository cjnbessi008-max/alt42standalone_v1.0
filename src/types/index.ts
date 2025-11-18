// 수학 함수 타입
export interface MathFunction {
  id: string;
  expression: string; // 예: "x^2 + 2*x + 1"
  label: string;
  color: string;
}

// LMS 문제 데이터 타입
export interface Problem {
  id: string;
  title: string;
  description: string;
  function: MathFunction;
  difficulty: 'easy' | 'medium' | 'hard';
  hints?: string[];
}

// 그래프 포인트 타입
export interface GraphPoint {
  x: number;
  y: number;
}

// 애니메이션 상태 타입
export type AnimationState = 'idle' | 'pulsing' | 'transitioning';

// Derivative Pulse 설정
export interface DerivativePulseConfig {
  duration: number; // ms
  intensity: number; // 0-1
  color: string;
}
