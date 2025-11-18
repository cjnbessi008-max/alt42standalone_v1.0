import React from 'react';
import './StatsDisplay.css';
import type { Statistics } from '../types';

interface StatsDisplayProps {
  statistics: Statistics | null;
  quizName: string;
  loading: boolean;
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({ statistics, quizName, loading }) => {
  if (loading) {
    return (
      <div className="stats-display loading">
        <div className="loader"></div>
        <p>데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="stats-display empty">
        <p>퀴즈를 선택하세요</p>
      </div>
    );
  }

  return (
    <div className="stats-display">
      <div className="stats-header">
        <h3>{quizName}</h3>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">응시자 수</div>
          <div className="stat-value">{statistics.count}명</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">최저 점수</div>
          <div className="stat-value">{statistics.min.toFixed(1)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">최고 점수</div>
          <div className="stat-value">{statistics.max.toFixed(1)}</div>
        </div>
      </div>
    </div>
  );
};

export default StatsDisplay;
