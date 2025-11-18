import { useState, useCallback } from 'react';
import { sessionAPI } from '../services/api';
import type { Session } from '../types';

export const useSession = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSession = useCallback(
    async (
      studentId: string,
      studentName?: string,
      problemId?: string,
      problemTitle?: string
    ) => {
      setLoading(true);
      setError(null);

      try {
        const newSession = await sessionAPI.create({
          studentId,
          studentName,
          problemId,
          problemTitle,
        });
        setSession(newSession);
        return newSession;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create session';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getActiveSession = useCallback(async (studentId: string) => {
    setLoading(true);
    setError(null);

    try {
      const activeSession = await sessionAPI.getActive(studentId);
      setSession(activeSession);
      return activeSession;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get active session';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const endSession = useCallback(
    async (sessionId: string) => {
      setLoading(true);
      setError(null);

      try {
        const endedSession = await sessionAPI.end(sessionId);
        setSession(endedSession);
        return endedSession;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to end session';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearSession = useCallback(() => {
    setSession(null);
    setError(null);
  }, []);

  return {
    session,
    loading,
    error,
    createSession,
    getActiveSession,
    endSession,
    clearSession,
  };
};
