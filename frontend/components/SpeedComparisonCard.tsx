/**
 * Speed Comparison Card Component
 * Displays student's speed vs cohort average with visual indicators
 */
import React, { useEffect, useState } from 'react';
import {
  speedComparisonApi,
  SpeedComparison,
  SpeedComparisonResponse,
} from '../services/speedComparisonApi';
import './SpeedComparisonCard.css';

interface SpeedComparisonCardProps {
  studentId: string;
  moduleId: string;
  cohortId?: string;
  showRecommendations?: boolean;
}

export const SpeedComparisonCard: React.FC<SpeedComparisonCardProps> = ({
  studentId,
  moduleId,
  cohortId,
  showRecommendations = true,
}) => {
  const [data, setData] = useState<SpeedComparisonResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadComparisonData();
  }, [studentId, moduleId, cohortId]);

  const loadComparisonData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await speedComparisonApi.getSpeedComparison(
        studentId,
        moduleId,
        {
          cohortId,
          includeTrends: false,
        }
      );

      setData(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || '데이터를 불러오는데 실패했습니다.');
      console.error('Failed to load speed comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}초`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}분 ${remainingSeconds}초`;
  };

  const formatPercentage = (value: number): string => {
    return `${Math.round(value)}%`;
  };

  const getSpeedIndicator = (comparison: SpeedComparison) => {
    if (!comparison.speed_vs_average_ratio) return null;

    const ratio = comparison.speed_vs_average_ratio;
    if (ratio < 0.8) {
      return {
        label: '매우 빠름',
        color: '#4CAF50',
        icon: '🚀',
      };
    } else if (ratio < 1.0) {
      return {
        label: '빠름',
        color: '#8BC34A',
        icon: '⚡',
      };
    } else if (ratio < 1.2) {
      return {
        label: '평균',
        color: '#FFC107',
        icon: '✓',
      };
    } else {
      return {
        label: '천천히',
        color: '#FF9800',
        icon: '🐢',
      };
    }
  };

  if (loading) {
    return (
      <div className="speed-comparison-card loading">
        <div className="spinner"></div>
        <p>데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="speed-comparison-card error">
        <div className="error-icon">⚠️</div>
        <p className="error-message">{error}</p>
        <button onClick={loadComparisonData} className="retry-button">
          다시 시도
        </button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { comparison, recommendations } = data;
  const speedIndicator = getSpeedIndicator(comparison);

  return (
    <div className="speed-comparison-card">
      <div className="card-header">
        <h3 className="card-title">학습 속도 비교</h3>
        <span className="card-subtitle">Speed Comparison</span>
      </div>

      <div className="card-body">
        {/* Speed Indicator */}
        {speedIndicator && (
          <div className="speed-indicator" style={{ borderColor: speedIndicator.color }}>
            <span className="indicator-icon">{speedIndicator.icon}</span>
            <span className="indicator-label" style={{ color: speedIndicator.color }}>
              {speedIndicator.label}
            </span>
          </div>
        )}

        {/* Main Metrics */}
        <div className="metrics-grid">
          <div className="metric-card student-metric">
            <div className="metric-label">내 평균 속도</div>
            <div className="metric-label-en">Your Avg Speed</div>
            <div className="metric-value primary">
              {formatTime(comparison.student_avg_time_seconds)}
            </div>
            <div className="metric-subtext">
              문제당 • per problem
            </div>
          </div>

          <div className="metric-card cohort-metric">
            <div className="metric-label">반 평균 속도</div>
            <div className="metric-label-en">Class Avg Speed</div>
            <div className="metric-value secondary">
              {comparison.cohort_avg_time_seconds
                ? formatTime(comparison.cohort_avg_time_seconds)
                : 'N/A'}
            </div>
            <div className="metric-subtext">
              문제당 • per problem
            </div>
          </div>

          <div className="metric-card accuracy-metric">
            <div className="metric-label">정확도</div>
            <div className="metric-label-en">Accuracy</div>
            <div className="metric-value primary">
              {formatPercentage(comparison.student_accuracy)}
            </div>
            <div className="metric-subtext">
              {comparison.total_problems_attempted}문제 해결
            </div>
          </div>

          <div className="metric-card percentile-metric">
            <div className="metric-label">순위</div>
            <div className="metric-label-en">Percentile</div>
            <div className="metric-value primary">
              {comparison.student_percentile
                ? `상위 ${formatPercentage(100 - comparison.student_percentile)}`
                : 'N/A'}
            </div>
            {comparison.total_students_in_cohort && (
              <div className="metric-subtext">
                전체 {comparison.total_students_in_cohort}명 중
              </div>
            )}
          </div>
        </div>

        {/* Visual Comparison Bar */}
        {comparison.cohort_avg_time_seconds && (
          <div className="comparison-bar-container">
            <div className="comparison-bar-label">속도 비교</div>
            <div className="comparison-bar">
              <div
                className="student-bar"
                style={{
                  width: `${Math.min(
                    (comparison.student_avg_time_seconds /
                      Math.max(
                        comparison.student_avg_time_seconds,
                        comparison.cohort_avg_time_seconds
                      )) *
                      100,
                    100
                  )}%`,
                }}
              >
                <span className="bar-label">나</span>
              </div>
              <div
                className="cohort-bar"
                style={{
                  width: `${Math.min(
                    (comparison.cohort_avg_time_seconds /
                      Math.max(
                        comparison.student_avg_time_seconds,
                        comparison.cohort_avg_time_seconds
                      )) *
                      100,
                    100
                  )}%`,
                }}
              >
                <span className="bar-label">평균</span>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {showRecommendations && recommendations.length > 0 && (
          <div className="recommendations-section">
            <h4 className="recommendations-title">
              💡 추천사항
              <span className="recommendations-title-en">Recommendations</span>
            </h4>
            <ul className="recommendations-list">
              {recommendations.map((recommendation, index) => (
                <li key={index} className="recommendation-item">
                  {recommendation}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="card-footer">
        <button onClick={loadComparisonData} className="refresh-button">
          🔄 새로고침
        </button>
        {comparison.last_activity && (
          <span className="last-updated">
            마지막 활동: {new Date(comparison.last_activity).toLocaleDateString('ko-KR')}
          </span>
        )}
      </div>
    </div>
  );
};

export default SpeedComparisonCard;
