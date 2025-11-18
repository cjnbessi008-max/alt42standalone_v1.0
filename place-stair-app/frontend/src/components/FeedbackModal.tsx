import React from 'react';
import './FeedbackModal.css';

interface FeedbackModalProps {
  isCorrect: boolean;
  feedback: string;
  onNext: () => void;
  onRetry: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isCorrect,
  feedback,
  onNext,
  onRetry
}) => {
  return (
    <div className="feedback-modal-overlay">
      <div className={`feedback-modal fade-in ${isCorrect ? 'correct' : 'incorrect'}`}>
        <div className="feedback-icon">
          {isCorrect ? '🎉' : '🤔'}
        </div>

        <h2 className="feedback-title">
          {isCorrect ? '정답입니다!' : '다시 한 번 생각해보세요'}
        </h2>

        <p className="feedback-message">{feedback}</p>

        <div className="feedback-actions">
          {isCorrect ? (
            <button onClick={onNext} className="next-button">
              다음 문제 →
            </button>
          ) : (
            <>
              <button onClick={onRetry} className="retry-button">
                다시 풀기
              </button>
              <button onClick={onNext} className="skip-button">
                다음 문제로
              </button>
            </>
          )}
        </div>

        {isCorrect && (
          <div className="celebration-particles">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${1 + Math.random()}s`
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;
