/**
 * Stress Indicator Card Component
 * 학습 스트레스 지표 카드 컴포넌트
 */

import React from 'react';
import { StressIndicator, StressLevel } from '../types';
import './StressIndicatorCard.css';

interface StressIndicatorCardProps {
  indicator: StressIndicator;
}

const StressIndicatorCard: React.FC<StressIndicatorCardProps> = ({ indicator }) => {
  const getStressLevelLabel = (level: StressLevel): string => {
    switch (level) {
      case StressLevel.LOW:
        return '낮음';
      case StressLevel.MEDIUM:
        return '보통';
      case StressLevel.HIGH:
        return '높음';
      default:
        return level;
    }
  };

  const getStressLevelColor = (level: StressLevel): string => {
    switch (level) {
      case StressLevel.LOW:
        return '#4CAF50'; // 녹색
      case StressLevel.MEDIUM:
        return '#FF9800'; // 주황색
      case StressLevel.HIGH:
        return '#F44336'; // 빨간색
      default:
        return '#9E9E9E';
    }
  };

  const getStressLevelEmoji = (level: StressLevel): string => {
    switch (level) {
      case StressLevel.LOW:
        return '😊';
      case StressLevel.MEDIUM:
        return '😐';
      case StressLevel.HIGH:
        return '😰';
      default:
        return '🤔';
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('ko-KR');
  };

  const stressColor = getStressLevelColor(indicator.stress_level);

  return (
    <div className="stress-indicator-card">
      <div className="card-header">
        <div className="stress-level-badge" style={{ backgroundColor: stressColor }}>
          <span className="emoji">{getStressLevelEmoji(indicator.stress_level)}</span>
          <span className="level">{getStressLevelLabel(indicator.stress_level)}</span>
        </div>
        <div className="stress-score">
          <span className="score-value">{indicator.stress_score.toFixed(1)}</span>
          <span className="score-label">/ 100</span>
        </div>
      </div>

      <div className="card-body">
        <div className="student-info">
          <p><strong>학생 ID:</strong> {indicator.student_id}</p>
          <p><strong>모듈 ID:</strong> {indicator.module_id}</p>
          <p><strong>측정 시간:</strong> {formatTimestamp(indicator.timestamp)}</p>
        </div>

        <div className="stress-factors">
          <h4>스트레스 영향 요인</h4>
          <div className="factors-grid">
            <div className="factor">
              <span className="factor-label">오답률</span>
              <div className="factor-bar">
                <div
                  className="factor-fill"
                  style={{ width: `${indicator.factors.error_rate.score}%` }}
                />
              </div>
              <span className="factor-value">{indicator.factors.error_rate.value.toFixed(1)}%</span>
            </div>

            <div className="factor">
              <span className="factor-label">학습 시간</span>
              <div className="factor-bar">
                <div
                  className="factor-fill"
                  style={{ width: `${indicator.factors.time_spent.score}%` }}
                />
              </div>
              <span className="factor-value">{indicator.factors.time_spent.value.toFixed(1)}분</span>
            </div>

            <div className="factor">
              <span className="factor-label">재시도 횟수</span>
              <div className="factor-bar">
                <div
                  className="factor-fill"
                  style={{ width: `${indicator.factors.retry_count.score}%` }}
                />
              </div>
              <span className="factor-value">{indicator.factors.retry_count.value}회</span>
            </div>

            <div className="factor">
              <span className="factor-label">응답 시간 추세</span>
              <div className="factor-bar">
                <div
                  className="factor-fill"
                  style={{ width: `${indicator.factors.response_trend.score}%` }}
                />
              </div>
              <span className="factor-value">
                {indicator.factors.response_trend.value > 0 ? '빨라짐' :
                 indicator.factors.response_trend.value < 0 ? '느려짐' : '변화없음'}
              </span>
            </div>
          </div>
        </div>

        {indicator.recommendations && indicator.recommendations.length > 0 && (
          <div className="recommendations">
            <h4>권장 사항</h4>
            <ul>
              {indicator.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default StressIndicatorCard;
