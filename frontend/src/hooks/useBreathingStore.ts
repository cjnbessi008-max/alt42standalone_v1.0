import { create } from 'zustand';
import { BreathingPattern, BreathingSession, BREATHING_PATTERNS } from '../types/breathing';
import { lmsService } from '../services/lmsService';

interface BreathingStore {
  // State
  currentPattern: BreathingPattern;
  isActive: boolean;
  currentSession: BreathingSession | null;
  sessions: BreathingSession[];

  // Actions
  setPattern: (patternKey: string) => void;
  startSession: (userId: string) => void;
  stopSession: () => void;
  incrementCycle: () => void;
}

export const useBreathingStore = create<BreathingStore>((set, get) => ({
  // Initial state
  currentPattern: BREATHING_PATTERNS.relaxation,
  isActive: false,
  currentSession: null,
  sessions: [],

  // Actions
  setPattern: (patternKey: string) => {
    const pattern = BREATHING_PATTERNS[patternKey];
    if (pattern) {
      set({ currentPattern: pattern });
    }
  },

  startSession: (userId: string) => {
    const { currentPattern } = get();
    const newSession: BreathingSession = {
      id: `session-${Date.now()}`,
      userId,
      pattern: currentPattern,
      startTime: new Date(),
      completed: false,
      totalCycles: 0,
    };

    set({
      isActive: true,
      currentSession: newSession,
    });
  },

  stopSession: async () => {
    const { currentSession, sessions } = get();

    if (currentSession) {
      const completedSession: BreathingSession = {
        ...currentSession,
        endTime: new Date(),
        completed: true,
      };

      // LMS에 세션 로그 전송
      try {
        await lmsService.logBreathingSession(completedSession);
      } catch (error) {
        console.error('세션 로그 전송 실패:', error);
      }

      set({
        isActive: false,
        currentSession: null,
        sessions: [...sessions, completedSession],
      });
    } else {
      set({ isActive: false });
    }
  },

  incrementCycle: () => {
    const { currentSession } = get();
    if (currentSession) {
      set({
        currentSession: {
          ...currentSession,
          totalCycles: currentSession.totalCycles + 1,
        },
      });
    }
  },
}));
