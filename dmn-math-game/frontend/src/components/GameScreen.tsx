import React, { useEffect, useState } from 'react';
import { useGameStore } from '../services/store';
import { gameApi } from '../services/api';

const GameScreen: React.FC = () => {
  const {
    studentId,
    session,
    currentProblem,
    answer,
    startTime,
    showFeedback,
    feedbackMessage,
    isCorrect,
    setCurrentProblem,
    setAnswer,
    setFeedback,
    hideFeedback,
    setSession,
  } = useGameStore();

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (session && !currentProblem) {
      loadNextProblem();
    }
  }, [session, currentProblem]);

  const loadNextProblem = async () => {
    if (!session) return;

    try {
      const problem = await gameApi.getNextProblem(session.id);
      setCurrentProblem(problem);
    } catch (error) {
      console.error('Failed to load problem:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentProblem || !session || !studentId || answer.trim() === '') {
      return;
    }

    setIsSubmitting(true);

    try {
      const timeSpent = startTime ? Math.floor((Date.now() - startTime) / 1000) : undefined;
      const result = await gameApi.submitAnswer(
        currentProblem.id,
        session.id,
        studentId,
        parseInt(answer),
        timeSpent
      );

      setFeedback(result.feedback, result.is_correct);

      // Update session stats
      const updatedSession = await gameApi.getSession(session.id);
      setSession(updatedSession);

      // Wait for feedback, then load next problem
      setTimeout(() => {
        hideFeedback();
        loadNextProblem();
      }, 2000);

    } catch (error) {
      console.error('Failed to submit answer:', error);
      setFeedback('문제가 발생했어요. 다시 시도해주세요.', false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and negative sign
    if (value === '' || /^-?\d*$/.test(value)) {
      setAnswer(value);
    }
  };

  if (!currentProblem) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="card text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">문제를 준비하고 있어요...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Session Stats */}
        {session && (
          <div className="mb-6 flex justify-between items-center text-white">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="text-sm">문제 수</span>
              <div className="text-2xl font-bold">{session.total_problems}</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="text-sm">정답</span>
              <div className="text-2xl font-bold text-green-300">{session.correct_answers}</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="text-sm">정확도</span>
              <div className="text-2xl font-bold">{session.accuracy.toFixed(0)}%</div>
            </div>
          </div>
        )}

        {/* Problem Card */}
        <div className={`card fade-in ${showFeedback && isCorrect ? 'celebration' : ''}`}>
          <div className="text-center">
            <h2 className="text-xl text-gray-600 mb-8">문제를 풀어보세요</h2>

            <div className="text-6xl font-bold text-gray-800 mb-12">
              {currentProblem.question} = ?
            </div>

            <form onSubmit={handleSubmit}>
              <input
                type="text"
                inputMode="numeric"
                value={answer}
                onChange={handleInputChange}
                placeholder="답을 입력하세요"
                className="input-field text-center mb-6"
                autoFocus
                disabled={isSubmitting || showFeedback}
              />

              <button
                type="submit"
                className="btn-primary w-full text-xl"
                disabled={isSubmitting || showFeedback || answer.trim() === ''}
              >
                {isSubmitting ? '확인 중...' : '답 제출하기'}
              </button>
            </form>
          </div>
        </div>

        {/* Feedback */}
        {showFeedback && (
          <div
            className={`mt-6 p-6 rounded-xl text-center text-white font-semibold text-2xl fade-in ${
              isCorrect ? 'bg-green-500' : 'bg-orange-500'
            }`}
          >
            {feedbackMessage}
          </div>
        )}

        {/* Difficulty Level Indicator */}
        {session && (
          <div className="mt-6 text-center text-white/80 text-sm">
            난이도: {session.difficulty_level}단계
          </div>
        )}
      </div>
    </div>
  );
};

export default GameScreen;
