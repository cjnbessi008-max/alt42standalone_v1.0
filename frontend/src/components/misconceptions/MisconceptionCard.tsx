/**
 * MisconceptionCard Component
 * Displays a single misconception with details
 */
import React from 'react';
import { MisconceptionPattern } from '../../types';
import './MisconceptionCard.css';

interface MisconceptionCardProps {
  misconception: MisconceptionPattern;
  rank: number;
}

export const MisconceptionCard: React.FC<MisconceptionCardProps> = ({
  misconception,
  rank,
}) => {
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'high':
        return '#ef4444'; // Red
      case 'medium':
        return '#f59e0b'; // Orange
      case 'low':
        return '#10b981'; // Green
      default:
        return '#6b7280'; // Gray
    }
  };

  const getSeverityLabel = (severity: string): string => {
    switch (severity) {
      case 'high':
        return '높은 우선순위';
      case 'medium':
        return '중간 우선순위';
      case 'low':
        return '낮은 우선순위';
      default:
        return severity;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '오늘';
    } else if (diffDays === 1) {
      return '어제';
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR');
    }
  };

  return (
    <div
      className="misconception-card"
      style={{ borderLeftColor: getSeverityColor(misconception.severity) }}
    >
      <div className="card-header">
        <div className="rank-badge">#{rank}</div>
        <div className="card-title-section">
          <h3 className="card-title">{misconception.name}</h3>
          <p className="card-concept">개념: {misconception.concept_name}</p>
        </div>
      </div>

      <p className="card-description">{misconception.description}</p>

      <div className="card-stats">
        <div className="stat-item">
          <span className="stat-label">발생 횟수:</span>
          <span className="stat-value">{misconception.occurrence_count}회</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">최근 발생:</span>
          <span className="stat-value">{formatDate(misconception.last_occurred_at)}</span>
        </div>
        <div
          className="severity-badge"
          style={{ backgroundColor: getSeverityColor(misconception.severity) }}
        >
          {getSeverityLabel(misconception.severity)}
        </div>
      </div>

      {misconception.correction_strategy && (
        <div className="correction-strategy">
          <h4 className="correction-title">💡 개선 방법</h4>
          <p className="correction-text">{misconception.correction_strategy}</p>
        </div>
      )}
    </div>
  );
};
