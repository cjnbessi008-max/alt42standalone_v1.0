import { useState, useEffect, useRef, useCallback } from 'react';
import { timeTrackingAPI } from '../services/api';

/**
 * Custom hook for tracking time spent on a problem
 * 문제 풀이 시간을 자동으로 추적하는 커스텀 훅
 *
 * @param {string} studentId - LMS student ID
 * @param {string} problemId - LMS problem ID
 * @param {boolean} autoStart - Automatically start tracking on mount
 * @returns {object} Time tracking state and methods
 */
export function useProblemTimeTracking(studentId, problemId, autoStart = true) {
  const [isTracking, setIsTracking] = useState(false);
  const [attemptId, setAttemptId] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState(null);
  const [warningLevel, setWarningLevel] = useState(null); // null, 'approaching', 'exceeded'
  const [recommendedTime, setRecommendedTime] = useState(null);
  const [statistics, setStatistics] = useState(null);

  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);
  const lastEventRef = useRef(null);

  // Fetch problem statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const statsResponse = await timeTrackingAPI.getProblemStatistics(problemId);
      if (statsResponse.success && statsResponse.data) {
        setStatistics(statsResponse.data);

        // Calculate recommended time
        // Use 1.5x average time, or 600 seconds (10 minutes) as default if insufficient data
        const avgTime = statsResponse.data.avg_time_seconds;
        const totalAttempts = statsResponse.data.total_attempts || 0;

        let recTime;
        if (totalAttempts >= 3 && avgTime > 0) {
          recTime = Math.floor(avgTime * 1.5);
        } else {
          recTime = 600; // 10 minutes default
        }
        setRecommendedTime(recTime);
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
      // Set default recommended time if stats fetch fails
      setRecommendedTime(600);
    }
  }, [problemId]);

  // Start tracking
  const startTracking = useCallback(async () => {
    try {
      setError(null);

      // Fetch problem statistics for timeout warnings
      await fetchStatistics();

      // Check for existing active attempt
      const activeAttemptResponse = await timeTrackingAPI.getActiveAttempt(studentId, problemId);

      let currentAttemptId;
      if (activeAttemptResponse.data) {
        // Resume existing attempt
        currentAttemptId = activeAttemptResponse.data.id;
        const startedAt = new Date(activeAttemptResponse.data.started_at);
        setElapsedTime(Math.floor((Date.now() - startedAt.getTime()) / 1000));
      } else {
        // Start new attempt
        const response = await timeTrackingAPI.startAttempt(studentId, problemId);
        currentAttemptId = response.data.id;
        setElapsedTime(0);
      }

      setAttemptId(currentAttemptId);
      setIsTracking(true);
      startTimeRef.current = Date.now();

      // Start elapsed time counter
      intervalRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);

      // Record focus event
      await timeTrackingAPI.recordEvent(currentAttemptId, 'focus');
      lastEventRef.current = 'focus';
    } catch (err) {
      console.error('Error starting time tracking:', err);
      setError(err.message);
    }
  }, [studentId, problemId, fetchStatistics]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Record interaction event
  const recordInteraction = useCallback(async (interactionData = null) => {
    if (!attemptId || !isTracking) return;

    try {
      await timeTrackingAPI.recordEvent(attemptId, 'interaction', interactionData);
    } catch (err) {
      console.error('Error recording interaction:', err);
    }
  }, [attemptId, isTracking]);

  // Record hint request
  const recordHintRequest = useCallback(async (hintData = null) => {
    if (!attemptId || !isTracking) return;

    try {
      await timeTrackingAPI.recordEvent(attemptId, 'hint_request', hintData);
    } catch (err) {
      console.error('Error recording hint request:', err);
    }
  }, [attemptId, isTracking]);

  // Complete the attempt
  const completeAttempt = useCallback(async (isCorrect, answerData = null) => {
    if (!attemptId) {
      throw new Error('No active attempt to complete');
    }

    try {
      stopTracking();
      const response = await timeTrackingAPI.completeAttempt(attemptId, isCorrect, answerData);
      setAttemptId(null);
      return response.data;
    } catch (err) {
      console.error('Error completing attempt:', err);
      setError(err.message);
      throw err;
    }
  }, [attemptId, stopTracking]);

  // Calculate warning level based on elapsed time
  useEffect(() => {
    if (!isTracking || !recommendedTime || elapsedTime === 0) {
      setWarningLevel(null);
      return;
    }

    const threshold80 = recommendedTime * 0.8;

    if (elapsedTime >= recommendedTime) {
      setWarningLevel('exceeded');
    } else if (elapsedTime >= threshold80) {
      setWarningLevel('approaching');
    } else {
      setWarningLevel(null);
    }
  }, [isTracking, elapsedTime, recommendedTime]);

  // Handle visibility change (tab focus/blur)
  useEffect(() => {
    if (!attemptId || !isTracking) return;

    const handleVisibilityChange = async () => {
      const eventType = document.hidden ? 'blur' : 'focus';

      // Avoid duplicate events
      if (lastEventRef.current === eventType) return;

      try {
        await timeTrackingAPI.recordEvent(attemptId, eventType);
        lastEventRef.current = eventType;
      } catch (err) {
        console.error('Error recording visibility event:', err);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [attemptId, isTracking]);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && studentId && problemId && !isTracking && !attemptId) {
      startTracking();
    }
  }, [autoStart, studentId, problemId, isTracking, attemptId, startTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Format elapsed time as HH:MM:SS
  const formattedTime = useCallback(() => {
    const hours = Math.floor(elapsedTime / 3600);
    const minutes = Math.floor((elapsedTime % 3600) / 60);
    const seconds = elapsedTime % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [elapsedTime]);

  return {
    isTracking,
    attemptId,
    elapsedTime,
    formattedTime: formattedTime(),
    error,
    warningLevel,
    recommendedTime,
    statistics,
    startTracking,
    stopTracking,
    recordInteraction,
    recordHintRequest,
    completeAttempt,
  };
}
