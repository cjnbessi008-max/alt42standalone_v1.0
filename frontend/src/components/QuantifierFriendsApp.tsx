import React, { useState, useEffect } from 'react';
import { Problem, SubmitAnswerResponse } from '../types';
import { getCharacterByType, getCharacterMessages } from '../data/characters';
import { problemAPI, submissionAPI } from '../services/api';
import CharacterGuide from './CharacterGuide';
import ProblemCard from './ProblemCard';
import ResultScreen from './ResultScreen';
import './QuantifierFriendsApp.css';

/**
 * Main Quantifier Friends App Component
 * Manages the problem-solving flow with character guidance
 */
export const QuantifierFriendsApp: React.FC = () => {
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitAnswerResponse | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [studentId] = useState('student-' + Math.random().toString(36).substr(2, 9));

  // Load a random problem on mount
  useEffect(() => {
    loadRandomProblem();
  }, []);

  const loadRandomProblem = async () => {
    setIsLoading(true);
    setResult(null);
    setHintsUsed(0);
    setCurrentHintIndex(0);
    setShowHint(false);

    try {
      const problem = await problemAPI.getRandom();
      setCurrentProblem(problem);
    } catch (error) {
      console.error('Failed to load problem:', error);
      // Load a demo problem if API fails
      loadDemoProblem();
    } finally {
      setIsLoading(false);
    }
  };

  const loadDemoProblem = () => {
    // Demo problem for testing
    const demoProblem: Problem = {
      id: 'demo-1',
      title: '숫자와 짝수',
      description: '다음 명제의 참/거짓을 판단하세요.',
      quantifierType: 'universal',
      statement: '모든 숫자는 짝수이다.',
      options: [],
      correctAnswer: false,
      difficulty: 'easy',
      explanation: '3, 5, 7과 같은 홀수들이 존재하므로 이 명제는 거짓입니다.',
      hints: [
        '홀수가 있는지 생각해보세요.',
        '3은 짝수일까요?',
        '"모든"은 예외가 없어야 합니다.',
      ],
      tags: ['논리', '한정사', '짝수'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCurrentProblem(demoProblem);
  };

  const handleSubmitAnswer = async ({ answer, timeSpent }: { answer: any; timeSpent: number }) => {
    if (!currentProblem) return;

    setIsSubmitting(true);

    try {
      const response = await submissionAPI.submit({
        problemId: currentProblem.id,
        studentId,
        studentAnswer: answer,
        timeSpent,
        hintsUsed,
      });

      setResult(response);
    } catch (error) {
      console.error('Failed to submit answer:', error);
      // Mock result for demo
      const isCorrect = answer === currentProblem.correctAnswer;
      setResult({
        submission: {
          id: 'demo-sub-1',
          problemId: currentProblem.id,
          studentId,
          studentAnswer: answer,
          isCorrect,
          score: isCorrect ? 100 : 0,
          timeSpent,
          hintsUsed,
          attempts: 1,
          feedback: isCorrect ? '정답입니다!' : '틀렸습니다. 다시 시도해보세요.',
          createdAt: new Date().toISOString(),
        },
        feedback: isCorrect ? '정답입니다!' : '틀렸습니다.',
        explanation: isCorrect ? currentProblem.explanation : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextProblem = () => {
    loadRandomProblem();
  };

  const handleHintRequest = () => {
    if (currentProblem && currentProblem.hints && currentHintIndex < currentProblem.hints.length) {
      setShowHint(true);
      setHintsUsed(prev => prev + 1);
      setTimeout(() => {
        setShowHint(false);
        setCurrentHintIndex(prev => prev + 1);
      }, 5000);
    }
  };

  if (isLoading) {
    return (
      <div className="quantifier-app loading">
        <div className="loader"></div>
        <p>문제를 불러오는 중...</p>
      </div>
    );
  }

  if (!currentProblem) {
    return (
      <div className="quantifier-app error">
        <p>문제를 불러올 수 없습니다.</p>
        <button onClick={loadRandomProblem}>다시 시도</button>
      </div>
    );
  }

  const character = getCharacterByType(currentProblem.quantifierType);
  const messages = getCharacterMessages(character.id);

  let characterMessage = messages.greeting;
  if (result) {
    characterMessage = result.submission.isCorrect ? messages.correct : messages.incorrect;
  } else if (showHint && currentProblem.hints) {
    characterMessage = currentProblem.hints[currentHintIndex - 1] || messages.hints[0];
  }

  return (
    <div className="quantifier-app">
      {/* Header */}
      <div className="app-header">
        <h1>Quantifier Friends</h1>
        <p className="app-subtitle">논리 한정사와 함께하는 즐거운 학습</p>
      </div>

      {/* Character Guide */}
      <CharacterGuide
        character={character}
        message={characterMessage}
        showHint={!result && currentProblem.hints && currentProblem.hints.length > currentHintIndex}
        onHintRequest={handleHintRequest}
      />

      {/* Problem or Result */}
      {result ? (
        <ResultScreen
          result={result}
          character={character}
          onNextProblem={handleNextProblem}
        />
      ) : (
        <ProblemCard
          problem={currentProblem}
          onSubmit={handleSubmitAnswer}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Footer */}
      <div className="app-footer">
        <div className="hint-counter">💡 힌트 사용: {hintsUsed}</div>
      </div>
    </div>
  );
};

export default QuantifierFriendsApp;
