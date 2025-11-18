export type SessionPhase = 'idle' | 'inhale' | 'hold' | 'exhale' | 'complete';

export interface SessionConfig {
  duration: number; // in seconds
  inhale: number; // in seconds
  hold: number; // in seconds
  exhale: number; // in seconds
}

export interface BreathingCycle {
  phase: SessionPhase;
  timeRemaining: number;
  totalTime: number;
}
