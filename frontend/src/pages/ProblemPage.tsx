import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ReadingStage } from '../components/ReadingStage';
import { SolvingStage } from '../components/SolvingStage';
import { problemsAPI, progressAPI } from '../services/api';
import type {
  ProblemReadingStage,
  ProblemSolvingStage,
  StudentProgress,
  StageType,
  SubmitAnswerResponse,
} from '../types';

export const ProblemPage: React.FC = () => {
  const { problemId } = useParams<{ problemId: string }>();
  const navigate = useNavigate();

  const [currentStage, setCurrentStage] = useState<StageType>('reading');
  const [readingProblem, setReadingProblem] = useState<ProblemReadingStage | null>(null);
  const [solvingProblem, setSolvingProblem] = useState<ProblemSolvingStage | null>(null);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!problemId) {
      navigate('/problems');
      return;
    }

    initializeProblem();
  }, [problemId]);

  const initializeProblem = async () => {
    try {
      setIsLoading(true);

      // Check if student already has progress for this problem
      try {
        const existingProgress = await progressAPI.getProgress(problemId!);
        setProgress(existingProgress);
        setCurrentStage(existingProgress.current_stage);

        // If already in solving stage, load solving content
        if (existingProgress.current_stage === 'solving' || existingProgress.current_stage === 'completed') {
          const solvingData = await problemsAPI.getProblemSolvingStage(problemId!);
          setSolvingProblem(solvingData);
        } else {
          // Load reading content
          const readingData = await problemsAPI.getProblemReadingStage(problemId!);
          setReadingProblem(readingData);
        }
      } catch (error: any) {
        // No existing progress, start new
        if (error.response?.status === 404) {
          const newProgress = await progressAPI.startProblem(problemId!);
          setProgress(newProgress);
          setCurrentStage('reading');

          const readingData = await problemsAPI.getProblemReadingStage(problemId!);
          setReadingProblem(readingData);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Failed to initialize problem:', error);
      alert('문제를 불러오는데 실패했습니다.');
      navigate('/problems');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReading = async (duration: number) => {
    if (!problemId) return;

    try {
      setIsTransitioning(true);

      // Confirm reading completion
      await progressAPI.confirmReading(problemId, duration);

      // Start solving stage
      const updatedProgress = await progressAPI.startSolving(problemId);
      setProgress(updatedProgress);
      setCurrentStage('solving');

      // Load solving content
      const solvingData = await problemsAPI.getProblemSolvingStage(problemId);
      setSolvingProblem(solvingData);
    } catch (error) {
      console.error('Failed to transition to solving stage:', error);
      alert('다음 단계로 넘어가는데 실패했습니다.');
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleSubmitAnswer = async (
    answer: string,
    timeSpent: number
  ): Promise<SubmitAnswerResponse> => {
    if (!problemId) throw new Error('Problem ID is missing');

    const response = await progressAPI.submitAnswer(problemId, answer, timeSpent);

    // Update progress
    if (response.is_correct) {
      setCurrentStage('completed');
    }

    return response;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">문제를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {currentStage === 'reading' && readingProblem && (
        <ReadingStage
          problem={readingProblem}
          onConfirmReading={handleConfirmReading}
          isLoading={isTransitioning}
        />
      )}

      {(currentStage === 'solving' || currentStage === 'completed') && solvingProblem && (
        <SolvingStage problem={solvingProblem} onSubmitAnswer={handleSubmitAnswer} />
      )}
    </div>
  );
};
