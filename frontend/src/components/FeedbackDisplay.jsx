import React from 'react';
import './FeedbackDisplay.css';

/**
 * Feedback Display Component
 * Shows feedback after answer submission
 */
const FeedbackDisplay = ({ feedback, onNext, onRetry }) => {
  if (!feedback) return null;

  const { isCorrect, message, explanation, hint } = feedback;

  return (
    <div className={`feedback-display ${isCorrect ? 'correct' : 'incorrect'}`}>
      <div className="feedback-icon">
        {isCorrect ? '✅' : '❌'}
      </div>

      <div className="feedback-content">
        <h3 className="feedback-message">{message}</h3>

        {explanation && (
          <div className="feedback-explanation">
            <p>{explanation}</p>
          </div>
        )}

        {hint && !isCorrect && (
          <div className="feedback-hint">
            <strong>💡 힌트:</strong> {hint}
          </div>
        )}
      </div>

      <div className="feedback-actions">
        {isCorrect ? (
          <button className="next-btn" onClick={onNext}>
            다음 문제로 →
          </button>
        ) : (
          <button className="retry-btn" onClick={onRetry}>
            다시 시도하기
          </button>
        )}
      </div>
    </div>
  );
};

export default FeedbackDisplay;
