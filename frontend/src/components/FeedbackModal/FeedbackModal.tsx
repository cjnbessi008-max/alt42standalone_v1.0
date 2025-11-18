import React from 'react';
import { SubmitAnswerResponse } from '../../types';

interface FeedbackModalProps {
  result: SubmitAnswerResponse | null;
  onClose: () => void;
  onRetry?: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  result,
  onClose,
  onRetry,
}) => {
  if (!result) return null;

  const getIcon = () => {
    if (result.is_correct) return '🎉';
    if (result.score >= 80) return '👍';
    if (result.score >= 60) return '💪';
    return '📚';
  };

  const getColor = () => {
    if (result.is_correct) return '#4CAF50';
    if (result.score >= 60) return '#FFA726';
    return '#F44336';
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon and score */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '72px', marginBottom: '16px' }}>{getIcon()}</div>
          <div
            style={{
              fontSize: '48px',
              fontWeight: '700',
              color: getColor(),
              marginBottom: '8px',
            }}
          >
            {result.score}%
          </div>
          <div style={{ fontSize: '14px', color: '#999' }}>
            Attempt {result.attempt_number}
          </div>
        </div>

        {/* Feedback message */}
        <p
          style={{
            fontSize: '18px',
            textAlign: 'center',
            color: '#333',
            marginBottom: '24px',
            lineHeight: '1.5',
          }}
        >
          {result.feedback}
        </p>

        {/* Show correct answers if all attempts used */}
        {result.correct_answers && result.correct_answers.length > 0 && (
          <div
            style={{
              backgroundColor: '#F5F5F5',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px',
            }}
          >
            <h4 style={{ margin: '0 0 12px 0', color: '#666', fontSize: '14px' }}>
              Correct Answers:
            </h4>
            <div style={{ fontSize: '14px', color: '#333' }}>
              {result.correct_answers.map((conn, index) => (
                <div key={index} style={{ marginBottom: '4px' }}>
                  {conn.leftId} ➡️ {conn.rightId}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          {result.can_retry && onRetry && (
            <button
              onClick={onRetry}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: '#4A90E2',
                color: 'white',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)',
              }}
            >
              Try Again
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              border: '2px solid #E0E0E0',
              borderRadius: '8px',
              backgroundColor: 'white',
              color: '#666',
              cursor: 'pointer',
            }}
          >
            {result.can_retry ? 'Review' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
