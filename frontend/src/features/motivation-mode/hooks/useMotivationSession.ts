/**
 * React hook for managing motivation mode sessions
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ModeTrigger,
  ExitReason,
  Problem,
  FeedbackResponse,
  SessionSummary,
  ProblemSubmission,
} from '../types/motivationMode.types';
import { MotivationModeApi } from '../services/motivationModeApi';

interface UseMotivationSessionOptions {
  moduleId: string;
  onSessionEnd?: (summary: SessionSummary) => void;
  onError?: (error: Error) => void;
}

interface UseMotivationSessionReturn {
  // State
  sessionId: string | null;
  currentProblem: Problem | null;
  feedback: FeedbackResponse | null;
  summary: SessionSummary | null;
  isLoading: boolean;
  error: Error | null;
  currentStreak: number;
  problemsCompleted: number;
  problemsCorrect: number;

  // Actions
  startSession: (trigger?: ModeTrigger) => Promise<void>;
  submitAnswer: (answer: any) => Promise<void>;
  continueSession: () => Promise<void>;
  endSession: (reason?: ExitReason) => Promise<void>;
  resetFeedback: () => void;
}

export const useMotivationSession = ({
  moduleId,
  onSessionEnd,
  onError,
}: UseMotivationSessionOptions): UseMotivationSessionReturn => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [problemsCompleted, setProblemsCompleted] = useState(0);
  const [problemsCorrect, setProblemsCorrect] = useState(0);

  const problemStartTimeRef = useRef<number | null>(null);

  /**
   * Start a new motivation mode session
   */
  const startSession = useCallback(
    async (trigger: ModeTrigger = ModeTrigger.STUDENT_INITIATED) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await MotivationModeApi.startSession(moduleId, trigger);

        setSessionId(result.sessionId);
        setCurrentProblem(result.firstProblem);
        setCurrentStreak(0);
        setProblemsCompleted(0);
        setProblemsCorrect(0);
        setFeedback(null);
        setSummary(null);

        // Start timer for first problem
        problemStartTimeRef.current = Date.now();
      } catch (err) {
        const error = err as Error;
        setError(error);
        onError?.(error);
      } finally {
        setIsLoading(false);
      }
    },
    [moduleId, onError]
  );

  /**
   * Submit answer to current problem
   */
  const submitAnswer = useCallback(
    async (answer: any) => {
      if (!sessionId || !currentProblem) {
        throw new Error('No active session or problem');
      }

      setIsLoading(true);
      setError(null);

      try {
        // Calculate time spent
        const timeSpentSeconds = problemStartTimeRef.current
          ? Math.floor((Date.now() - problemStartTimeRef.current) / 1000)
          : undefined;

        const submission: ProblemSubmission = {
          problemId: currentProblem.id,
          answer,
          timeSpentSeconds,
        };

        const response = await MotivationModeApi.submitAnswer(
          moduleId,
          sessionId,
          submission
        );

        setFeedback(response);
        setCurrentStreak(response.streak);
        setProblemsCompleted((prev) => prev + 1);
        if (response.isCorrect) {
          setProblemsCorrect((prev) => prev + 1);
        }

        // Clear current problem (will show feedback instead)
        setCurrentProblem(null);
      } catch (err) {
        const error = err as Error;
        setError(error);
        onError?.(error);
      } finally {
        setIsLoading(false);
      }
    },
    [moduleId, sessionId, currentProblem, onError]
  );

  /**
   * Continue to next problem
   */
  const continueSession = useCallback(async () => {
    if (!sessionId) {
      throw new Error('No active session');
    }

    setIsLoading(true);
    setError(null);
    setFeedback(null);

    try {
      const result = await MotivationModeApi.getNextProblem(moduleId, sessionId);

      setCurrentProblem(result.problem);
      setCurrentStreak(result.currentStreak);
      setProblemsCompleted(result.sessionStats.completed);
      setProblemsCorrect(result.sessionStats.correct);

      // Start timer for new problem
      problemStartTimeRef.current = Date.now();
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [moduleId, sessionId, onError]);

  /**
   * End the session
   */
  const endSession = useCallback(
    async (reason: ExitReason = ExitReason.STUDENT_CHOICE) => {
      if (!sessionId) {
        throw new Error('No active session');
      }

      setIsLoading(true);
      setError(null);

      try {
        const summary = await MotivationModeApi.endSession(moduleId, sessionId, reason);

        setSummary(summary);
        setSessionId(null);
        setCurrentProblem(null);
        setFeedback(null);

        onSessionEnd?.(summary);
      } catch (err) {
        const error = err as Error;
        setError(error);
        onError?.(error);
      } finally {
        setIsLoading(false);
      }
    },
    [moduleId, sessionId, onSessionEnd, onError]
  );

  /**
   * Reset feedback (when user acknowledges it)
   */
  const resetFeedback = useCallback(() => {
    setFeedback(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      problemStartTimeRef.current = null;
    };
  }, []);

  return {
    // State
    sessionId,
    currentProblem,
    feedback,
    summary,
    isLoading,
    error,
    currentStreak,
    problemsCompleted,
    problemsCorrect,

    // Actions
    startSession,
    submitAnswer,
    continueSession,
    endSession,
    resetFeedback,
  };
};
