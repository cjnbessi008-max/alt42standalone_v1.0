/**
 * React Hook for Focus Card functionality
 *
 * Manages complexity assessment and focus card display state
 */

import { useState, useEffect, useCallback } from 'react';
import {
  ComplexityAssessment,
  ComplexityLevel,
} from '../types/complexity';
import ComplexityApiService, {
  AssessComplexityParams,
  LMSProblemMetadata,
} from '../services/complexityApi';

interface UseFocusCardOptions {
  language?: 'ko' | 'en';
  autoShow?: boolean; // Automatically show focus card if complexity is high
}

interface UseFocusCardReturn {
  assessment: ComplexityAssessment | null;
  isLoading: boolean;
  error: Error | null;
  showFocusCard: boolean;
  assessComplexity: (params: AssessComplexityParams) => Promise<void>;
  assessFromLMS: (metadata: LMSProblemMetadata) => Promise<void>;
  handleContinue: () => void;
  handleRequestHelp: () => void;
  reset: () => void;
}

export const useFocusCard = (
  options: UseFocusCardOptions = {}
): UseFocusCardReturn => {
  const { language = 'ko', autoShow = true } = options;

  const [assessment, setAssessment] = useState<ComplexityAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [showFocusCard, setShowFocusCard] = useState(false);

  // Assess complexity using direct metrics
  const assessComplexity = useCallback(
    async (params: AssessComplexityParams) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await ComplexityApiService.assessComplexity({
          ...params,
          language,
        });

        setAssessment(result);

        // Automatically show focus card if needed
        if (autoShow && result.requires_focus_card) {
          setShowFocusCard(true);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Assessment failed');
        setError(error);
        console.error('Complexity assessment error:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [language, autoShow]
  );

  // Assess complexity from LMS metadata
  const assessFromLMS = useCallback(
    async (metadata: LMSProblemMetadata) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await ComplexityApiService.assessFromLMSMetadata(
          metadata,
          language
        );

        setAssessment(result);

        // Automatically show focus card if needed
        if (autoShow && result.requires_focus_card) {
          setShowFocusCard(true);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('LMS assessment failed');
        setError(error);
        console.error('LMS complexity assessment error:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [language, autoShow]
  );

  // Handle user continuing past focus card
  const handleContinue = useCallback(() => {
    setShowFocusCard(false);
    // You can add analytics tracking here
    console.log('User continued past focus card');
  }, []);

  // Handle user requesting help
  const handleRequestHelp = useCallback(() => {
    setShowFocusCard(false);
    // Implement help request logic (e.g., open help modal, contact teacher)
    console.log('User requested help for complex problem');
    // You can dispatch an event or call a help service here
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setAssessment(null);
    setIsLoading(false);
    setError(null);
    setShowFocusCard(false);
  }, []);

  return {
    assessment,
    isLoading,
    error,
    showFocusCard,
    assessComplexity,
    assessFromLMS,
    handleContinue,
    handleRequestHelp,
    reset,
  };
};

export default useFocusCard;
