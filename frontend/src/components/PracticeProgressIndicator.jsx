import React from 'react';
import './PracticeProgressIndicator.css';

/**
 * Practice Progress Indicator Component
 * Displays student progress and mastery level
 */
const PracticeProgressIndicator = ({ progress, onPracticeMore }) => {
  if (!progress) {
    return (
      <div className="progress-indicator">
        <p className="progress-message">연습을 시작하세요!</p>
      </div>
    );
  }

  const {
    percentage = 0,
    mastery_level = 'beginner',
    accuracy_percentage = 0,
    total_attempts = 0,
    correct_attempts = 0,
  } = progress;

  const masteryLabels = {
    beginner: '초보',
    intermediate: '중급',
    advanced: '고급',
    mastery: '마스터',
  };

  const masteryColors = {
    beginner: '#95a5a6',
    intermediate: '#3498db',
    advanced: '#f39c12',
    mastery: '#27ae60',
  };

  const showPracticeMoreButton = accuracy_percentage >= 75 && accuracy_percentage < 95;

  return (
    <div className="progress-indicator">
      <h3>학습 진행 상황</h3>

      {/* Mastery Level */}
      <div className="mastery-level">
        <span className="label">숙련도:</span>
        <span
          className="mastery-badge"
          style={{ backgroundColor: masteryColors[mastery_level] }}
        >
          {masteryLabels[mastery_level]}
        </span>
      </div>

      {/* Accuracy */}
      <div className="accuracy-section">
        <div className="stat-row">
          <span className="label">정확도:</span>
          <span className="value">{accuracy_percentage.toFixed(1)}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${Math.min(accuracy_percentage, 100)}%`,
              backgroundColor:
                accuracy_percentage >= 80
                  ? '#27ae60'
                  : accuracy_percentage >= 60
                  ? '#f39c12'
                  : '#e74c3c',
            }}
          />
        </div>
      </div>

      {/* Attempts */}
      <div className="attempts-section">
        <div className="stat-row">
          <span className="label">총 시도:</span>
          <span className="value">{total_attempts}회</span>
        </div>
        <div className="stat-row">
          <span className="label">정답:</span>
          <span className="value correct">{correct_attempts}회</span>
        </div>
        <div className="stat-row">
          <span className="label">오답:</span>
          <span className="value incorrect">{total_attempts - correct_attempts}회</span>
        </div>
      </div>

      {/* Practice More Button */}
      {showPracticeMoreButton && onPracticeMore && (
        <div className="practice-more-section">
          <p className="encouragement">
            거의 다 왔어요! 조금만 더 연습하면 완벽하게 마스터할 수 있어요!
          </p>
          <button className="practice-more-btn" onClick={onPracticeMore}>
            살짝만 더 해보자! 🚀
          </button>
        </div>
      )}

      {/* Mastery Achievement */}
      {accuracy_percentage >= 95 && (
        <div className="mastery-achieved">
          <p className="celebration">🎉 축하합니다! 마스터하셨어요! 🎉</p>
        </div>
      )}
    </div>
  );
};

export default PracticeProgressIndicator;
