/**
 * Progress State Store
 * Manages student progress tracking
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ProgressState, StudentProgress, StudentStats } from '@types/index';
import { apiService } from '@services/api';

export const useProgressStore = create<ProgressState>()(
  devtools(
    (set, get) => ({
      currentProgress: null,
      progressHistory: [],
      stats: null,
      interactionCount: 0,
      startTime: null,

      startProgress: (studentId, questionId, sessionId) => {
        set(
          {
            currentProgress: {
              id: 0,
              student_id: studentId,
              question_id: questionId,
              session_id: sessionId,
              attempt_number: 1,
              is_correct: false,
              time_spent_seconds: 0,
              interaction_count: 0,
              started_at: new Date().toISOString(),
              answer_data: {},
            } as StudentProgress,
            interactionCount: 0,
            startTime: Date.now(),
          },
          false,
          'startProgress'
        );
      },

      updateProgress: (data) => {
        const current = get().currentProgress;
        if (current) {
          set(
            {
              currentProgress: { ...current, ...data },
            },
            false,
            'updateProgress'
          );
        }
      },

      completeProgress: async (isCorrect) => {
        const current = get().currentProgress;
        const startTime = get().startTime;

        if (!current || !startTime) return;

        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        const interactionCount = get().interactionCount;

        const updatedProgress: Partial<StudentProgress> = {
          is_correct: isCorrect,
          time_spent_seconds: timeSpent,
          interaction_count: interactionCount,
          completed_at: new Date().toISOString(),
        };

        set(
          {
            currentProgress: { ...current, ...updatedProgress } as StudentProgress,
          },
          false,
          'completeProgress'
        );

        // Save to backend
        try {
          if (current.id) {
            await apiService.updateProgress(current.id, updatedProgress);
          } else {
            const created = await apiService.createProgress({
              ...current,
              ...updatedProgress,
            });
            set({ currentProgress: created }, false, 'completeProgress/created');
          }

          // Add to history
          const history = get().progressHistory;
          set(
            {
              progressHistory: [...history, get().currentProgress!],
            },
            false,
            'completeProgress/history'
          );
        } catch (error) {
          console.error('Failed to save progress:', error);
        }
      },

      incrementInteraction: () => {
        set(
          (state) => ({ interactionCount: state.interactionCount + 1 }),
          false,
          'incrementInteraction'
        );
      },

      loadStats: async (studentId) => {
        try {
          const stats = await apiService.getStudentStats(studentId);
          set({ stats }, false, 'loadStats');
        } catch (error) {
          console.error('Failed to load stats:', error);
        }
      },

      reset: () =>
        set(
          {
            currentProgress: null,
            progressHistory: [],
            stats: null,
            interactionCount: 0,
            startTime: null,
          },
          false,
          'reset'
        ),
    }),
    { name: 'ProgressStore' }
  )
);
