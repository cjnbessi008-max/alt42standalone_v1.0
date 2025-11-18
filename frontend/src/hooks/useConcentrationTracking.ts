/**
 * useConcentrationTracking Hook
 *
 * React hook for tracking student concentration and managing bypass offers
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

interface ConcentrationScore {
  score: number;
  timeEfficiencyScore: number;
  successRateScore: number;
  engagementScore: number;
  focusScore: number;
  recentAttemptsCount: number;
  recentCorrectCount: number;
  avgTimeSpent: number;
}

interface BypassCheck {
  shouldOffer: boolean;
  triggerReason: 'low_concentration' | 'multiple_failures' | 'excessive_time' | null;
  concentrationScore: number;
  failureCount: number;
  avgTimeSpent: number;
  threshold: number;
  difficultyReduction: number;
}

interface BypassOffer {
  bypassEvent: any;
  easierProblem: any;
  message: {
    ko: string;
    en: string;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export function useConcentrationTracking(studentId: string, moduleId: string) {
  const [concentrationScore, setConcentrationScore] = useState<ConcentrationScore | null>(null);
  const [bypassOffer, setBypassOffer] = useState<BypassOffer | null>(null);
  const [showBypassPrompt, setShowBypassPrompt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tracking metrics
  const [currentProblemId, setCurrentProblemId] = useState<string | null>(null);
  const [problemStartTime, setProblemStartTime] = useState<number | null>(null);
  const [interactionCount, setInteractionCount] = useState(0);
  const [pauseCount, setPauseCount] = useState(0);
  const [focusLostCount, setFocusLostCount] = useState(0);

  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000
  });

  /**
   * Fetch current concentration status
   */
  const fetchConcentrationStatus = useCallback(async () => {
    try {
      const response = await axiosInstance.get(
        `/concentration/${studentId}/${moduleId}`
      );

      if (response.data.success) {
        setConcentrationScore(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching concentration status:', err);
      setError(err.message);
    }
  }, [studentId, moduleId]);

  /**
   * Calculate fresh concentration score
   */
  const calculateConcentration = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.post('/concentration/calculate', {
        studentId,
        moduleId,
        recentAttemptsWindow: 5
      });

      if (response.data.success) {
        setConcentrationScore(response.data.data);
        return response.data.data;
      }
    } catch (err: any) {
      console.error('Error calculating concentration:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [studentId, moduleId]);

  /**
   * Check if bypass should be offered
   */
  const checkBypass = useCallback(
    async (problemId: string): Promise<BypassCheck | null> => {
      try {
        const response = await axiosInstance.post('/concentration/check-bypass', {
          studentId,
          moduleId,
          currentProblemId: problemId
        });

        if (response.data.success) {
          return response.data.data;
        }
        return null;
      } catch (err: any) {
        console.error('Error checking bypass:', err);
        setError(err.message);
        return null;
      }
    },
    [studentId, moduleId]
  );

  /**
   * Offer bypass to student
   */
  const offerBypass = useCallback(
    async (
      problemId: string,
      difficulty: number,
      triggerReason: string,
      concentrationScoreValue: number
    ) => {
      try {
        const response = await axiosInstance.post('/concentration/offer-bypass', {
          studentId,
          moduleId,
          originalProblemId: problemId,
          originalDifficulty: difficulty,
          triggerReason,
          concentrationScore: concentrationScoreValue,
          difficultyReduction: 1
        });

        if (response.data.success) {
          setBypassOffer(response.data.data);
          setShowBypassPrompt(true);
          return response.data.data;
        }
      } catch (err: any) {
        console.error('Error offering bypass:', err);
        setError(err.message);
      }
    },
    [studentId, moduleId]
  );

  /**
   * Accept bypass offer
   */
  const acceptBypass = useCallback(async () => {
    if (!bypassOffer?.bypassEvent?.id) return;

    try {
      const response = await axiosInstance.put(
        `/concentration/bypass/${bypassOffer.bypassEvent.id}/accept`
      );

      if (response.data.success) {
        setShowBypassPrompt(false);
        return bypassOffer.easierProblem;
      }
    } catch (err: any) {
      console.error('Error accepting bypass:', err);
      setError(err.message);
    }
  }, [bypassOffer]);

  /**
   * Decline bypass offer
   */
  const declineBypass = useCallback(async () => {
    if (!bypassOffer?.bypassEvent?.id) return;

    try {
      await axiosInstance.put(
        `/concentration/bypass/${bypassOffer.bypassEvent.id}/decline`
      );
      setShowBypassPrompt(false);
      setBypassOffer(null);
    } catch (err: any) {
      console.error('Error declining bypass:', err);
      setError(err.message);
    }
  }, [bypassOffer]);

  /**
   * Complete bypass problem
   */
  const completeBypass = useCallback(
    async (success: boolean, returnToOriginal = false) => {
      if (!bypassOffer?.bypassEvent?.id) return;

      try {
        await axiosInstance.put(
          `/concentration/bypass/${bypassOffer.bypassEvent.id}/complete`,
          {
            success,
            returnToOriginal
          }
        );
        setBypassOffer(null);
      } catch (err: any) {
        console.error('Error completing bypass:', err);
        setError(err.message);
      }
    },
    [bypassOffer]
  );

  /**
   * Start tracking a new problem
   */
  const startProblem = useCallback((problemId: string) => {
    setCurrentProblemId(problemId);
    setProblemStartTime(Date.now());
    setInteractionCount(0);
    setPauseCount(0);
    setFocusLostCount(0);
  }, []);

  /**
   * Track interaction (click, input, etc.)
   */
  const trackInteraction = useCallback(() => {
    setInteractionCount((prev) => prev + 1);
  }, []);

  /**
   * Track pause/inactivity
   */
  const trackPause = useCallback(() => {
    setPauseCount((prev) => prev + 1);
  }, []);

  /**
   * Track focus loss (tab switch, window blur)
   */
  const trackFocusLoss = useCallback(() => {
    setFocusLostCount((prev) => prev + 1);
  }, []);

  /**
   * Get current problem metrics
   */
  const getProblemMetrics = useCallback(() => {
    const timeSpent = problemStartTime
      ? Math.floor((Date.now() - problemStartTime) / 1000)
      : 0;

    return {
      timeSpentSeconds: timeSpent,
      interactionCount,
      pauseCount,
      focusLostCount
    };
  }, [problemStartTime, interactionCount, pauseCount, focusLostCount]);

  /**
   * Auto-check bypass after each attempt
   */
  const checkAndOfferBypass = useCallback(
    async (problemId: string, difficulty: number) => {
      const bypassCheck = await checkBypass(problemId);

      if (bypassCheck?.shouldOffer && bypassCheck.triggerReason) {
        await offerBypass(
          problemId,
          difficulty,
          bypassCheck.triggerReason,
          bypassCheck.concentrationScore
        );
      }
    },
    [checkBypass, offerBypass]
  );

  // Track window focus/blur
  useEffect(() => {
    const handleBlur = () => trackFocusLoss();
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [trackFocusLoss]);

  // Fetch initial concentration status
  useEffect(() => {
    if (studentId && moduleId) {
      fetchConcentrationStatus();
    }
  }, [studentId, moduleId, fetchConcentrationStatus]);

  return {
    // State
    concentrationScore,
    bypassOffer,
    showBypassPrompt,
    loading,
    error,

    // Actions
    calculateConcentration,
    checkBypass,
    offerBypass,
    acceptBypass,
    declineBypass,
    completeBypass,
    checkAndOfferBypass,

    // Problem tracking
    startProblem,
    trackInteraction,
    trackPause,
    trackFocusLoss,
    getProblemMetrics,

    // Current metrics
    currentProblemId,
    interactionCount,
    pauseCount,
    focusLostCount
  };
}

export default useConcentrationTracking;
