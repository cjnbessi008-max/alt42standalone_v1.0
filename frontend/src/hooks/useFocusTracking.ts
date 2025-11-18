/**
 * useFocusTracking Hook
 * React hook for tracking student focus and triggering mental alignment routines
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import FocusTrackingService from '../services/focusTrackingService';
import type { FocusSession, FocusBreak, BreakReason, RoutineType } from '../types/focus';

interface UseFocusTrackingOptions {
  studentId: string;
  moduleId: string;
  autoStart?: boolean;
  checkInterval?: number; // Interval to check for break needs (ms)
  idleThreshold?: number; // Idle threshold in seconds
}

interface UseFocusTrackingReturn {
  session: FocusSession | null;
  currentBreak: FocusBreak | null;
  isIdle: boolean;
  showRoutineModal: boolean;
  startSession: () => Promise<void>;
  endSession: () => Promise<void>;
  recordInteraction: () => Promise<void>;
  triggerManualBreak: () => Promise<void>;
  completeBreak: (effectivenessRating?: number) => Promise<void>;
  skipBreak: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const useFocusTracking = ({
  studentId,
  moduleId,
  autoStart = true,
  checkInterval = 30000, // Check every 30 seconds
  idleThreshold = 120 // 2 minutes
}: UseFocusTrackingOptions): UseFocusTrackingReturn => {
  const [session, setSession] = useState<FocusSession | null>(null);
  const [currentBreak, setCurrentBreak] = useState<FocusBreak | null>(null);
  const [isIdle, setIsIdle] = useState(false);
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastActivityRef = useRef<number>(Date.now());
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Start a new focus session
  const startSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check for existing active session
      const activeSession = await FocusTrackingService.getActiveSession(studentId, moduleId);

      if (activeSession) {
        setSession(activeSession);
      } else {
        const newSession = await FocusTrackingService.createSession(studentId, moduleId);
        setSession(newSession);
      }

      lastActivityRef.current = Date.now();
      setIsIdle(false);
    } catch (err) {
      setError('세션을 시작하는데 실패했습니다.');
      console.error('Failed to start session:', err);
    } finally {
      setLoading(false);
    }
  }, [studentId, moduleId]);

  // End the current focus session
  const endSession = useCallback(async () => {
    if (!session) return;

    try {
      setLoading(true);
      const endedSession = await FocusTrackingService.endSession(session.id);
      setSession(endedSession);

      // Clear timers
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    } catch (err) {
      setError('세션을 종료하는데 실패했습니다.');
      console.error('Failed to end session:', err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Record user interaction
  const recordInteraction = useCallback(async () => {
    if (!session) return;

    try {
      lastActivityRef.current = Date.now();
      setIsIdle(false);

      // Update session interaction count
      await FocusTrackingService.recordInteraction(session.id);

      // Reset idle timer
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      idleTimerRef.current = setTimeout(() => {
        setIsIdle(true);
      }, idleThreshold * 1000);
    } catch (err) {
      console.error('Failed to record interaction:', err);
    }
  }, [session, idleThreshold]);

  // Trigger a manual break
  const triggerManualBreak = useCallback(async () => {
    if (!session) return;

    try {
      const focusBreak = await FocusTrackingService.createBreak({
        session_id: session.id,
        student_id: studentId,
        break_reason: 'manual' as BreakReason,
        routine_type: undefined // Will use recommended routine
      });

      setCurrentBreak(focusBreak);
      setShowRoutineModal(true);
    } catch (err) {
      setError('휴식을 시작하는데 실패했습니다.');
      console.error('Failed to trigger break:', err);
    }
  }, [session, studentId]);

  // Trigger an automatic break
  const triggerAutoBreak = useCallback(async (reason: BreakReason, idleDuration?: number) => {
    if (!session) return;

    try {
      const focusBreak = await FocusTrackingService.createBreak({
        session_id: session.id,
        student_id: studentId,
        break_reason: reason,
        idle_duration_seconds: idleDuration,
        routine_type: undefined // Will use recommended routine
      });

      setCurrentBreak(focusBreak);
      setShowRoutineModal(true);
    } catch (err) {
      setError('자동 휴식을 시작하는데 실패했습니다.');
      console.error('Failed to trigger auto break:', err);
    }
  }, [session, studentId]);

  // Complete the current break
  const completeBreak = useCallback(async (effectivenessRating?: number) => {
    if (!currentBreak) return;

    try {
      await FocusTrackingService.completeRoutine(currentBreak.id, effectivenessRating);
      setCurrentBreak(null);
      setShowRoutineModal(false);
      lastActivityRef.current = Date.now();
      setIsIdle(false);
    } catch (err) {
      setError('루틴 완료 기록에 실패했습니다.');
      console.error('Failed to complete break:', err);
    }
  }, [currentBreak]);

  // Skip the current break
  const skipBreak = useCallback(async () => {
    if (!currentBreak) return;

    try {
      await FocusTrackingService.skipRoutine(currentBreak.id);
      setCurrentBreak(null);
      setShowRoutineModal(false);
    } catch (err) {
      console.error('Failed to skip break:', err);
      // Still close the modal
      setCurrentBreak(null);
      setShowRoutineModal(false);
    }
  }, [currentBreak]);

  // Check if break is needed (periodic check)
  const checkBreakNeeded = useCallback(async () => {
    if (!session) return;

    try {
      const result = await FocusTrackingService.checkBreakNeeded(session.id, studentId);

      if (result.should_trigger_break && result.break_reason) {
        const timeSinceActivity = (Date.now() - lastActivityRef.current) / 1000;
        await triggerAutoBreak(result.break_reason, Math.floor(timeSinceActivity));
      }
    } catch (err) {
      console.error('Failed to check break status:', err);
    }
  }, [session, studentId, triggerAutoBreak]);

  // Auto-start session on mount
  useEffect(() => {
    if (autoStart) {
      startSession();
    }

    // Cleanup on unmount
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [autoStart, startSession]);

  // Set up periodic break check
  useEffect(() => {
    if (!session || session.session_end) return;

    checkIntervalRef.current = setInterval(() => {
      checkBreakNeeded();
    }, checkInterval);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [session, checkInterval, checkBreakNeeded]);

  // Set up idle detection
  useEffect(() => {
    if (!session || session.session_end) return;

    const handleActivity = () => {
      recordInteraction();
    };

    // Listen for user interactions
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Start idle timer
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, idleThreshold * 1000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [session, idleThreshold, recordInteraction]);

  // Auto-trigger break when idle for too long
  useEffect(() => {
    if (isIdle && session && !currentBreak) {
      const timeSinceActivity = (Date.now() - lastActivityRef.current) / 1000;
      if (timeSinceActivity >= idleThreshold) {
        triggerAutoBreak('idle_timeout' as BreakReason, Math.floor(timeSinceActivity));
      }
    }
  }, [isIdle, session, currentBreak, idleThreshold, triggerAutoBreak]);

  return {
    session,
    currentBreak,
    isIdle,
    showRoutineModal,
    startSession,
    endSession,
    recordInteraction,
    triggerManualBreak,
    completeBreak,
    skipBreak,
    loading,
    error
  };
};

export default useFocusTracking;
