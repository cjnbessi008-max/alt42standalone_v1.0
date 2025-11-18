/**
 * Progress Tracker Component
 * Displays student progress and achievements
 */

import React from 'react';
import { Progress } from '../types';

interface ProgressTrackerProps {
  progress: Progress;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ progress }) => {
  const completionPercentage = progress.totalProblems > 0
    ? (progress.problemsSolved / progress.totalProblems) * 100
    : 0;

  const accuracyPercentage = progress.accuracy * 100;

  const getAccuracyColor = () => {
    if (accuracyPercentage >= 80) return '#4CAF50';
    if (accuracyPercentage >= 60) return '#FF9800';
    return '#F44336';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="progress-tracker">
      <h3>학습 진행 상황</h3>

      <div className="progress-stats">
        <div className="stat-card">
          <div className="stat-label">해결한 문제</div>
          <div className="stat-value">
            {progress.problemsSolved} / {progress.totalProblems}
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${completionPercentage}%`,
                backgroundColor: '#2196F3',
              }}
            />
          </div>
          <div className="stat-percentage">{completionPercentage.toFixed(0)}% 완료</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">정확도</div>
          <div className="stat-value" style={{ color: getAccuracyColor() }}>
            {accuracyPercentage.toFixed(1)}%
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${accuracyPercentage}%`,
                backgroundColor: getAccuracyColor(),
              }}
            />
          </div>
        </div>
      </div>

      <div className="last-activity">
        <small>마지막 활동: {formatDate(progress.lastActivity)}</small>
      </div>

      {completionPercentage === 100 && (
        <div className="completion-badge">
          🏆 모든 문제를 완료했습니다!
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;
