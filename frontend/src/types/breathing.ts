export type BreathingPhase = 'inhale' | 'hold-in' | 'exhale' | 'hold-out';

export interface BreathingPattern {
  name: string;
  description: string;
  inhale: number;    // 초 단위
  holdIn: number;    // 들이마신 후 멈춤
  exhale: number;    // 내쉬기
  holdOut: number;   // 내쉰 후 멈춤
}

export interface BreathingSession {
  id: string;
  userId: string;
  pattern: BreathingPattern;
  startTime: Date;
  endTime?: Date;
  completed: boolean;
  totalCycles: number;
}

export const BREATHING_PATTERNS: Record<string, BreathingPattern> = {
  relaxation: {
    name: '안정 호흡',
    description: '긴장 완화와 스트레스 해소에 효과적',
    inhale: 4,
    holdIn: 4,
    exhale: 4,
    holdOut: 4,
  },
  energizing: {
    name: '활력 호흡',
    description: '에너지 충전과 집중력 향상',
    inhale: 4,
    holdIn: 7,
    exhale: 8,
    holdOut: 0,
  },
  quick: {
    name: '빠른 안정',
    description: '짧은 시간에 빠르게 안정',
    inhale: 3,
    holdIn: 3,
    exhale: 3,
    holdOut: 3,
  },
  deep: {
    name: '깊은 호흡',
    description: '깊은 이완과 명상에 적합',
    inhale: 6,
    holdIn: 6,
    exhale: 6,
    holdOut: 6,
  },
};
