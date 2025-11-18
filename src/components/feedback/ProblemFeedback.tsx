import React, { useState, useEffect } from 'react';
import { FeedbackProps, isEasyProblem } from '../../types/problem';
import { MiniCelebration } from '../celebrations/MiniCelebration';
import './ProblemFeedback.css';

/**
 * ProblemFeedback Component
 *
 * Displays feedback after student submits an answer to a problem.
 * Automatically shows mini celebration effect for easy problems (difficulty 1-2).
 *
 * Features:
 * - Shows success/error message with appropriate styling
 * - Triggers mini celebration for correct answers on easy problems
 * - Optional explanation text
 * - "Next Problem" button
 * - Accessible keyboard navigation
 *
 * @example
 * ```tsx
 * <ProblemFeedback
 *   isCorrect={true}
 *   difficultyLevel={2}
 *   explanation="분수를 올바르게 더했습니다!"
 *   onNext={handleNextProblem}
 * />
 * ```
 */
export const ProblemFeedback: React.FC<FeedbackProps> = ({
  isCorrect,
  difficultyLevel,
  explanation,
  onNext,
  showCelebration = true,
}) => {
  const [displayCelebration, setDisplayCelebration] = useState(false);

  useEffect(() => {
    // Show celebration only for correct answers on easy problems
    if (isCorrect && showCelebration && isEasyProblem(difficultyLevel)) {
      setDisplayCelebration(true);
    }
  }, [isCorrect, difficultyLevel, showCelebration]);

  const handleCelebrationComplete = () => {
    setDisplayCelebration(false);
  };

  return (
    <div className="problem-feedback" data-testid="problem-feedback">
      {/* Mini Celebration (appears above feedback card) */}
      <MiniCelebration
        show={displayCelebration}
        onComplete={handleCelebrationComplete}
      />

      {/* Feedback Card */}
      <div
        className={`feedback-card ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`}
        role="alert"
        aria-live="polite"
      >
        {/* Icon and Status */}
        <div className="feedback-header">
          <div className="feedback-icon">
            {isCorrect ? '✓' : '✗'}
          </div>
          <h3 className="feedback-title">
            {isCorrect ? '정답입니다!' : '다시 한번 시도해보세요'}
          </h3>
        </div>

        {/* Explanation */}
        {explanation && (
          <div className="feedback-explanation">
            <p>{explanation}</p>
          </div>
        )}

        {/* Difficulty indicator (for easy problems) */}
        {isCorrect && isEasyProblem(difficultyLevel) && (
          <div className="feedback-difficulty">
            <span className="difficulty-badge easy">쉬운 문제</span>
          </div>
        )}

        {/* Action Button */}
        {onNext && (
          <div className="feedback-actions">
            <button
              type="button"
              onClick={onNext}
              className="btn-next"
              aria-label="다음 문제로 이동"
            >
              {isCorrect ? '다음 문제' : '다시 풀기'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemFeedback;
