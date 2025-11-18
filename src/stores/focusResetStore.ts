import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FocusResetSettings, FocusResetSession } from '../types';

interface FocusResetState {
  settings: FocusResetSettings;
  currentSession: FocusResetSession | null;
  isActive: boolean;
  questionsSinceLastReset: number;
  totalResets: number;

  // Actions
  updateSettings: (settings: Partial<FocusResetSettings>) => void;
  startFocusReset: (questionBefore: string, questionAfter: string) => void;
  completeFocusReset: () => void;
  skipFocusReset: () => void;
  incrementQuestionCount: () => void;
  resetQuestionCount: () => void;
  shouldShowFocusReset: () => boolean;
}

const defaultSettings: FocusResetSettings = {
  enabled: true,
  frequency: 3, // 3문제마다
  duration: 15, // 15초
  preferredActivity: 'breathing',
  autoSkip: false
};

export const useFocusResetStore = create<FocusResetState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      currentSession: null,
      isActive: false,
      questionsSinceLastReset: 0,
      totalResets: 0,

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        }));
      },

      startFocusReset: (questionBefore, questionAfter) => {
        const { settings } = get();

        const session: FocusResetSession = {
          activityType: settings.preferredActivity,
          startTime: Date.now(),
          duration: settings.duration,
          completed: false,
          questionBefore,
          questionAfter
        };

        set({
          currentSession: session,
          isActive: true
        });
      },

      completeFocusReset: () => {
        const { currentSession } = get();
        if (!currentSession) return;

        set((state) => ({
          currentSession: { ...currentSession, completed: true },
          isActive: false,
          questionsSinceLastReset: 0,
          totalResets: state.totalResets + 1
        }));
      },

      skipFocusReset: () => {
        set({
          currentSession: null,
          isActive: false,
          questionsSinceLastReset: 0
        });
      },

      incrementQuestionCount: () => {
        set((state) => ({
          questionsSinceLastReset: state.questionsSinceLastReset + 1
        }));
      },

      resetQuestionCount: () => {
        set({ questionsSinceLastReset: 0 });
      },

      shouldShowFocusReset: () => {
        const { settings, questionsSinceLastReset } = get();
        return (
          settings.enabled &&
          questionsSinceLastReset > 0 &&
          questionsSinceLastReset % settings.frequency === 0
        );
      }
    }),
    {
      name: 'focus-reset-storage'
    }
  )
);
