import React from 'react';
import './PracticeMoreModal.css';

/**
 * Practice More Modal Component
 * Shows "살짝만 더 해보자" suggestion modal
 */
const PracticeMoreModal = ({ show, suggestion, onAccept, onDecline }) => {
  if (!show) return null;

  const {
    message = '조금만 더 연습하면 완벽하게 마스터할 수 있어요!',
    suggested_count = 3,
    current_accuracy = 0,
    target_accuracy = 95,
  } = suggestion || {};

  return (
    <div className="modal-overlay" onClick={onDecline}>
      <div className="practice-more-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🚀 살짝만 더 해보자!</h2>
        </div>

        <div className="modal-body">
          <div className="motivation-message">
            <p className="main-message">{message}</p>
          </div>

          <div className="progress-comparison">
            <div className="progress-item current">
              <span className="label">현재 정확도</span>
              <span className="value">{current_accuracy.toFixed(1)}%</span>
            </div>
            <div className="arrow">→</div>
            <div className="progress-item target">
              <span className="label">목표 정확도</span>
              <span className="value">{target_accuracy}%</span>
            </div>
          </div>

          <div className="suggestion-details">
            <p className="suggested-count">
              추천 연습 문제 개수: <strong>{suggested_count}개</strong>
            </p>
            <p className="benefit">
              조금만 더 연습하면 이 주제를 완벽하게 마스터할 수 있어요!
            </p>
          </div>
        </div>

        <div className="modal-actions">
          <button className="decline-btn" onClick={onDecline}>
            나중에 할게요
          </button>
          <button className="accept-btn" onClick={onAccept}>
            좋아요! 더 해볼게요! 🎯
          </button>
        </div>
      </div>
    </div>
  );
};

export default PracticeMoreModal;
