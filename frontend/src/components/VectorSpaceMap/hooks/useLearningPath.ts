import { useState, useEffect } from 'react';
import vectorSpaceApi from '@services/vectorSpaceApi';
import type { StudentLearningPath } from '@types/index';

/**
 * 학생 학습 경로 Hook
 */
export function useLearningPath(studentId?: string, moduleId?: string) {
  const [learningPath, setLearningPath] = useState<StudentLearningPath | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!studentId || !moduleId) {
      setLearningPath(null);
      return;
    }

    const fetchLearningPath = async () => {
      try {
        setLoading(true);
        setError(null);
        const path = await vectorSpaceApi.getStudentLearningPath(studentId, moduleId);
        setLearningPath(path);
      } catch (err) {
        setError(err as Error);
        console.error('Failed to fetch learning path:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLearningPath();
  }, [studentId, moduleId]);

  return { learningPath, loading, error };
}

export default useLearningPath;
