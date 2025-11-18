/**
 * Emotion Refresh Routine - Emotion State Hook
 * ============================================
 * Custom React hook for managing emotion state
 */

import { useState, useCallback } from 'react';
import { emotionApi } from '../services/emotionApi';
import {
  EmotionType,
  EmotionCheckInRequest,
  EmotionCheckInResponse,
  GenerateActivityRequest,
  GenerateActivityResponse,
  CompleteSessionRequest,
  CompleteSessionResponse,
  StudentEmotionHistoryResponse,
  ActivityContent,
} from '../types/emotion';

interface UseEmotionStateReturn {
  // State
  currentEmotion?: EmotionType;
  currentScore?: number;
  lastCheckIn?: EmotionCheckInResponse;
  activeSession?: {
    sessionId: string;
    activity: ActivityContent;
    preEmotion: EmotionType;
    preScore: number;
    startTime: number;
  };
  loading: boolean;
  error?: string;

  // Actions
  checkIn: (request: EmotionCheckInRequest) => Promise<EmotionCheckInResponse>;
  generateActivity: (
    request: GenerateActivityRequest
  ) => Promise<GenerateActivityResponse>;
  completeSession: (
    request: CompleteSessionRequest
  ) => Promise<CompleteSessionResponse>;
  getHistory: (
    studentId: string,
    days?: number
  ) => Promise<StudentEmotionHistoryResponse>;
  startActivity: (
    activity: ActivityContent,
    sessionId: string,
    preEmotion: EmotionType,
    preScore: number
  ) => void;
  endActivity: () => void;
  clearError: () => void;
}

/**
 * Custom hook for emotion state management
 */
export const useEmotionState = (): UseEmotionStateReturn => {
  // State
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType | undefined>();
  const [currentScore, setCurrentScore] = useState<number | undefined>();
  const [lastCheckIn, setLastCheckIn] = useState<
    EmotionCheckInResponse | undefined
  >();
  const [activeSession, setActiveSession] = useState<
    | {
        sessionId: string;
        activity: ActivityContent;
        preEmotion: EmotionType;
        preScore: number;
        startTime: number;
      }
    | undefined
  >();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Check in emotion
  const checkIn = useCallback(
    async (request: EmotionCheckInRequest): Promise<EmotionCheckInResponse> => {
      setLoading(true);
      setError(undefined);

      try {
        const response = await emotionApi.createCheckIn(request);

        setCurrentEmotion(request.emotion_type);
        setCurrentScore(request.emotion_score);
        setLastCheckIn(response);

        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create check-in';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Generate activity
  const generateActivity = useCallback(
    async (
      request: GenerateActivityRequest
    ): Promise<GenerateActivityResponse> => {
      setLoading(true);
      setError(undefined);

      try {
        const response = await emotionApi.generateActivity(request);
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to generate activity';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Complete session
  const completeSession = useCallback(
    async (
      request: CompleteSessionRequest
    ): Promise<CompleteSessionResponse> => {
      setLoading(true);
      setError(undefined);

      try {
        const response = await emotionApi.completeSession(request);

        // Update current emotion to post-activity state
        setCurrentEmotion(request.post_emotion_type);
        setCurrentScore(request.post_emotion_score);

        // Clear active session
        setActiveSession(undefined);

        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to complete session';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get history
  const getHistory = useCallback(
    async (
      studentId: string,
      days: number = 7
    ): Promise<StudentEmotionHistoryResponse> => {
      setLoading(true);
      setError(undefined);

      try {
        const response = await emotionApi.getStudentHistory(studentId, days);
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get history';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Start activity
  const startActivity = useCallback(
    (
      activity: ActivityContent,
      sessionId: string,
      preEmotion: EmotionType,
      preScore: number
    ) => {
      setActiveSession({
        sessionId,
        activity,
        preEmotion,
        preScore,
        startTime: Date.now(),
      });
    },
    []
  );

  // End activity
  const endActivity = useCallback(() => {
    setActiveSession(undefined);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(undefined);
  }, []);

  return {
    // State
    currentEmotion,
    currentScore,
    lastCheckIn,
    activeSession,
    loading,
    error,

    // Actions
    checkIn,
    generateActivity,
    completeSession,
    getHistory,
    startActivity,
    endActivity,
    clearError,
  };
};

export default useEmotionState;
