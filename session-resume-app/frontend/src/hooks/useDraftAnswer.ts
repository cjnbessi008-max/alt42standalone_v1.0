/**
 * useDraftAnswer Hook - Manage draft answer with auto-save
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { debounce } from 'lodash';
import { draftApi } from '../services/api';

interface UseDraftAnswerOptions {
  moduleId: string;
  problemId: string;
  studentId: string;
  autoSaveDelay?: number; // milliseconds, default 5000
}

interface UseDraftAnswerReturn {
  draftAnswer: Record<string, any> | null;
  timeSpent: number;
  hintsViewed: number;
  isLoaded: boolean;
  updateDraftAnswer: (answer: Record<string, any>) => void;
  clearDraft: () => Promise<void>;
  incrementTimeSpent: () => void;
  incrementHintsViewed: () => void;
}

export const useDraftAnswer = ({
  moduleId,
  problemId,
  studentId,
  autoSaveDelay = 5000,
}: UseDraftAnswerOptions): UseDraftAnswerReturn => {
  const [draftAnswer, setDraftAnswer] = useState<Record<string, any> | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [hintsViewed, setHintsViewed] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load draft on mount
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const response = await draftApi.getDraft(moduleId, problemId, studentId);

        if (response.has_draft && response.draft) {
          setDraftAnswer(response.draft.draft_answer);
          setTimeSpent(response.draft.time_spent_seconds);
          setHintsViewed(response.draft.hints_viewed);
        }
      } catch (err) {
        console.error('Failed to load draft:', err);

        // Try localStorage fallback
        try {
          const stored = localStorage.getItem(`draft_${problemId}_${studentId}`);
          if (stored) {
            const data = JSON.parse(stored);
            setDraftAnswer(data.answer);
            setTimeSpent(data.timeSpent || 0);
            setHintsViewed(data.hintsViewed || 0);
          }
        } catch (storageErr) {
          console.error('Failed to load from localStorage:', storageErr);
        }
      } finally {
        setIsLoaded(true);
      }
    };

    loadDraft();
  }, [moduleId, problemId, studentId]);

  // Save draft
  const saveDraft = useCallback(
    async (answer: Record<string, any>) => {
      try {
        await draftApi.saveDraft(
          moduleId,
          problemId,
          studentId,
          answer,
          timeSpent,
          hintsViewed
        );
      } catch (err) {
        console.error('Failed to save draft:', err);

        // Fallback to localStorage
        try {
          localStorage.setItem(
            `draft_${problemId}_${studentId}`,
            JSON.stringify({ answer, timeSpent, hintsViewed })
          );
        } catch (storageErr) {
          console.error('Failed to save to localStorage:', storageErr);
        }
      }
    },
    [moduleId, problemId, studentId, timeSpent, hintsViewed]
  );

  // Debounced auto-save
  const debouncedSave = useRef(
    debounce((answer: Record<string, any>) => {
      saveDraft(answer);
    }, autoSaveDelay)
  ).current;

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  // Update draft answer
  const updateDraftAnswer = useCallback(
    (answer: Record<string, any>) => {
      setDraftAnswer(answer);
      debouncedSave(answer);
    },
    [debouncedSave]
  );

  // Clear draft (on submit)
  const clearDraft = useCallback(async () => {
    try {
      await draftApi.deleteDraft(moduleId, problemId, studentId);
      setDraftAnswer(null);
      setTimeSpent(0);
      setHintsViewed(0);

      // Clear localStorage too
      localStorage.removeItem(`draft_${problemId}_${studentId}`);
    } catch (err) {
      console.error('Failed to clear draft:', err);
    }
  }, [moduleId, problemId, studentId]);

  // Increment time spent
  const incrementTimeSpent = useCallback(() => {
    setTimeSpent((t) => t + 1);
  }, []);

  // Increment hints viewed
  const incrementHintsViewed = useCallback(() => {
    setHintsViewed((h) => h + 1);
  }, []);

  return {
    draftAnswer,
    timeSpent,
    hintsViewed,
    isLoaded,
    updateDraftAnswer,
    clearDraft,
    incrementTimeSpent,
    incrementHintsViewed,
  };
};
