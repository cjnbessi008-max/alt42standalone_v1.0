import React, { useState, useEffect, useCallback } from 'react';
import MoleculeCanvas from '../MoleculeCanvas';
import type { Problem, GameState } from '../../types';
import { findDivisors, calculateDifficulty, generateNumberWithDivisors } from '../../utils/divisor';

interface DivisorGameProps {
  initialProblem?: Problem;
  onComplete?: (score: number, timeSpent: number) => void;
}

const DivisorGame: React.FC<DivisorGameProps> = ({ initialProblem, onComplete }) => {
  const [gameState, setGameState] = useState<GameState>({
    currentProblem: null,
    score: 0,
    timeRemaining: 0,
    foundDivisors: [],
    isComplete: false,
  });

  const [startTime, setStartTime] = useState<number>(Date.now());
  const [showHint, setShowHint] = useState(false);

  // Generate a new problem
  const generateProblem = useCallback((difficulty: 'easy' | 'medium' | 'hard' = 'medium') => {
    let number: number;
    let divisors: number[];

    switch (difficulty) {
      case 'easy':
        number = generateNumberWithDivisors(6, 20, 4);
        break;
      case 'medium':
        number = generateNumberWithDivisors(12, 50, 6);
        break;
      case 'hard':
        number = generateNumberWithDivisors(30, 100, 8);
        break;
    }

    divisors = findDivisors(number);

    const problem: Problem = {
      id: `problem-${Date.now()}`,
      number,
      divisors,
      difficulty: calculateDifficulty(number),
      timeLimit: 120, // 2 minutes
    };

    return problem;
  }, []);

  // Initialize game
  useEffect(() => {
    const problem = initialProblem || generateProblem();
    setGameState({
      currentProblem: problem,
      score: 0,
      timeRemaining: problem.timeLimit || 120,
      foundDivisors: [],
      isComplete: false,
    });
    setStartTime(Date.now());
  }, [initialProblem, generateProblem]);

  // Timer
  useEffect(() => {
    if (gameState.isComplete || !gameState.currentProblem) return;

    const timer = setInterval(() => {
      setGameState((prev) => {
        const newTimeRemaining = prev.timeRemaining - 1;

        if (newTimeRemaining <= 0) {
          handleGameComplete(false);
          return { ...prev, timeRemaining: 0, isComplete: true };
        }

        return { ...prev, timeRemaining: newTimeRemaining };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.isComplete, gameState.currentProblem]);

  const handleDivisorFound = (divisor: number) => {
    if (gameState.foundDivisors.includes(divisor)) return;

    setGameState((prev) => {
      const newFoundDivisors = [...prev.foundDivisors, divisor];
      const newScore = prev.score + 10;

      // Check if all divisors found
      const allFound =
        prev.currentProblem &&
        newFoundDivisors.length === prev.currentProblem.divisors.length;

      if (allFound) {
        handleGameComplete(true);
      }

      return {
        ...prev,
        foundDivisors: newFoundDivisors,
        score: newScore,
        isComplete: allFound || prev.isComplete,
      };
    });
  };

  const handleGameComplete = (success: boolean) => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const finalScore = success ? gameState.score + gameState.timeRemaining : gameState.score;

    setGameState((prev) => ({
      ...prev,
      score: finalScore,
      isComplete: true,
    }));

    onComplete?.(finalScore, timeSpent);
  };

  const handleNewGame = () => {
    const newProblem = generateProblem();
    setGameState({
      currentProblem: newProblem,
      score: 0,
      timeRemaining: newProblem.timeLimit || 120,
      foundDivisors: [],
      isComplete: false,
    });
    setStartTime(Date.now());
    setShowHint(false);
  };

  const toggleHint = () => {
    setShowHint(!showHint);
  };

  if (!gameState.currentProblem) {
    return <div className="flex items-center justify-center h-full">로딩 중...</div>;
  }

  const progress =
    (gameState.foundDivisors.length / gameState.currentProblem.divisors.length) * 100;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-12">
      {/* Header */}
      <div className="px-6 py-4 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <h1 className="text-xl font-bold text-gray-800">약수 분자</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold text-gray-600">
              점수: <span className="text-blue-600">{gameState.score}</span>
            </div>
            <div className="text-sm font-semibold text-gray-600">
              ⏱️ {Math.floor(gameState.timeRemaining / 60)}:
              {(gameState.timeRemaining % 60).toString().padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-2 text-xs text-gray-500 text-center">
          {gameState.foundDivisors.length} / {gameState.currentProblem.divisors.length} 약수 발견
        </div>
      </div>

      {/* Instructions */}
      <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
        <p className="text-sm text-blue-800 text-center">
          🧪 분자를 드래그하여 중앙의 숫자와 결합시키세요!
        </p>
      </div>

      {/* Game Canvas */}
      <div className="flex-1 flex items-center justify-center p-4">
        {!gameState.isComplete ? (
          <MoleculeCanvas
            targetNumber={gameState.currentProblem.number}
            divisors={gameState.currentProblem.divisors}
            onDivisorFound={handleDivisorFound}
            foundDivisors={gameState.foundDivisors}
          />
        ) : (
          <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-sm">
            <div className="text-6xl mb-4">
              {gameState.foundDivisors.length === gameState.currentProblem.divisors.length
                ? '🎉'
                : '⏰'}
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {gameState.foundDivisors.length === gameState.currentProblem.divisors.length
                ? '완료!'
                : '시간 종료!'}
            </h2>
            <p className="text-gray-600 mb-4">
              최종 점수: <span className="font-bold text-blue-600">{gameState.score}</span>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              {gameState.foundDivisors.length} / {gameState.currentProblem.divisors.length} 약수 발견
            </p>
            <button
              onClick={handleNewGame}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              새 게임 시작
            </button>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      {!gameState.isComplete && (
        <div className="px-6 py-4 bg-white/80 backdrop-blur-sm border-t border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={toggleHint}
              className="flex-1 bg-yellow-500 text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-yellow-600 transition-colors text-sm"
            >
              💡 힌트
            </button>
            <button
              onClick={handleNewGame}
              className="flex-1 bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-gray-600 transition-colors text-sm"
            >
              🔄 새 문제
            </button>
          </div>

          {showHint && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>{gameState.currentProblem.number}</strong>의 약수는{' '}
                <strong>{gameState.currentProblem.divisors.length}개</strong>입니다.
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                아직 찾지 못한 약수: {gameState.currentProblem.divisors.length - gameState.foundDivisors.length}개
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DivisorGame;
