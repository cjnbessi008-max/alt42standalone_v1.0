/**
 * Main game page component
 */
import React, { useEffect, useState } from 'react';
import { SmartphoneFrame } from '../components/SmartphoneFrame';
import { PatternBoard } from '../components/PatternBoard';
import { ResultModal } from '../components/ResultModal';
import { useGameState } from '../hooks/useGameState';
import { problemApi, attemptApi } from '../services/api';
import type { DifficultyLevel } from '../types';

const STUDENT_ID = 1; // TODO: Get from auth context

export const GamePage: React.FC = () => {
  const {
    currentProblem,
    currentSequence,
    timeElapsed,
    attemptNumber,
    isPlaying,
    lastAttempt,
    startGame,
    endGame,
    setLastAttempt,
    incrementTime,
    incrementAttempt,
  } = useGameState();

  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Timer effect
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      incrementTime();
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, incrementTime]);

  // Load initial problem
  useEffect(() => {
    loadNextProblem();
  }, []);

  const loadNextProblem = async (difficulty?: DifficultyLevel) => {
    setIsLoading(true);
    try {
      const response = await problemApi.getRandomNext(
        difficulty ? { difficulty } : undefined
      );
      startGame(response.data);
    } catch (error) {
      console.error('Failed to load problem:', error);
      alert('Failed to load problem. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentProblem) return;

    incrementAttempt();

    try {
      const response = await attemptApi.submit({
        problem_id: currentProblem.id,
        student_id: STUDENT_ID,
        submitted_sequence: currentSequence,
        time_spent_seconds: timeElapsed,
      });

      setLastAttempt(response.data);
      setShowResult(true);

      if (response.data.is_correct) {
        endGame();
      }
    } catch (error) {
      console.error('Failed to submit attempt:', error);
      alert('Failed to submit answer. Please try again.');
    }
  };

  const handleCloseResult = () => {
    setShowResult(false);
  };

  const handleNextProblem = () => {
    setShowResult(false);
    loadNextProblem();
  };

  const handleRetry = () => {
    setShowResult(false);
  };

  const canRetry =
    currentProblem && attemptNumber < currentProblem.max_attempts - 1;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🔄</div>
          <p className="text-xl text-gray-700">Loading problem...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Permutation Pattern Matching
          </h1>
          <p className="text-gray-600">Arrange the elements to match the pattern!</p>
        </header>

        {/* Difficulty Selector */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => loadNextProblem('beginner')}
            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
          >
            Beginner
          </button>
          <button
            onClick={() => loadNextProblem('intermediate')}
            className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-colors"
          >
            Intermediate
          </button>
          <button
            onClick={() => loadNextProblem('advanced')}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors"
          >
            Advanced
          </button>
          <button
            onClick={() => loadNextProblem('expert')}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
          >
            Expert
          </button>
        </div>

        {/* Instructions */}
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-3">How to Play</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Study the initial sequence and the pattern hint</li>
            <li>Drag and drop elements to rearrange them</li>
            <li>Submit your answer when you think it's correct</li>
            <li>You have limited attempts and time for each problem</li>
          </ol>
        </div>
      </div>

      {/* Virtual Smartphone Display */}
      <SmartphoneFrame position="bottom-right">
        <PatternBoard onSubmit={handleSubmit} />
      </SmartphoneFrame>

      {/* Result Modal */}
      <ResultModal
        attempt={lastAttempt}
        onClose={handleCloseResult}
        onNextProblem={handleNextProblem}
        onRetry={handleRetry}
        canRetry={canRetry}
      />
    </div>
  );
};
