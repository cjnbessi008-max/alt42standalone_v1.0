/**
 * Speed Trend Chart Component
 * Displays historical speed trends with line chart
 */
import React, { useEffect, useState } from 'react';
import {
  speedComparisonApi,
  SpeedTrend,
  SpeedComparisonResponse,
} from '../services/speedComparisonApi';
import './SpeedTrendChart.css';

interface SpeedTrendChartProps {
  studentId: string;
  moduleId: string;
  cohortId?: string;
  trendDays?: number;
}

export const SpeedTrendChart: React.FC<SpeedTrendChartProps> = ({
  studentId,
  moduleId,
  cohortId,
  trendDays = 30,
}) => {
  const [trends, setTrends] = useState<SpeedTrend[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTrendData();
  }, [studentId, moduleId, cohortId, trendDays]);

  const loadTrendData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await speedComparisonApi.getSpeedComparison(
        studentId,
        moduleId,
        {
          cohortId,
          includeTrends: true,
          trendDays,
        }
      );

      setTrends(response.trends);
    } catch (err: any) {
      setError(err.response?.data?.detail || '추세 데이터를 불러오는데 실패했습니다.');
      console.error('Failed to load trend data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const getMaxValue = () => {
    if (trends.length === 0) return 100;

    const maxStudentSpeed = Math.max(...trends.map((t) => t.avg_speed_seconds));
    const maxCohortSpeed = Math.max(
      ...trends.map((t) => t.cohort_avg_speed_seconds || 0)
    );

    return Math.max(maxStudentSpeed, maxCohortSpeed) * 1.2;
  };

  const calculatePosition = (value: number, maxValue: number): number => {
    return (1 - value / maxValue) * 100;
  };

  const renderChart = () => {
    if (trends.length === 0) {
      return (
        <div className="no-data-message">
          <p>📊 아직 추세 데이터가 충분하지 않습니다.</p>
          <p className="no-data-subtext">
            더 많은 문제를 풀면 여기에 학습 속도 추이가 표시됩니다.
          </p>
        </div>
      );
    }

    const maxValue = getMaxValue();
    const chartWidth = 100;
    const pointSpacing = chartWidth / (trends.length - 1 || 1);

    // Calculate points for lines
    const studentPoints = trends
      .map((trend, index) => {
        const x = index * pointSpacing;
        const y = calculatePosition(trend.avg_speed_seconds, maxValue);
        return `${x},${y}`;
      })
      .join(' ');

    const cohortPoints = trends
      .map((trend, index) => {
        if (!trend.cohort_avg_speed_seconds) return null;
        const x = index * pointSpacing;
        const y = calculatePosition(trend.cohort_avg_speed_seconds, maxValue);
        return `${x},${y}`;
      })
      .filter(Boolean)
      .join(' ');

    return (
      <div className="chart-container">
        <div className="chart-y-axis">
          <span className="y-axis-label">속도 (초)</span>
        </div>

        <div className="chart-area">
          <svg className="chart-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Grid lines */}
            <line x1="0" y1="25" x2="100" y2="25" className="grid-line" />
            <line x1="0" y1="50" x2="100" y2="50" className="grid-line" />
            <line x1="0" y1="75" x2="100" y2="75" className="grid-line" />

            {/* Cohort line */}
            {cohortPoints && (
              <polyline
                points={cohortPoints}
                className="cohort-line"
                fill="none"
                stroke="#f5576c"
                strokeWidth="0.5"
                strokeDasharray="2,2"
              />
            )}

            {/* Student line */}
            <polyline
              points={studentPoints}
              className="student-line"
              fill="none"
              stroke="#667eea"
              strokeWidth="1"
            />

            {/* Data points */}
            {trends.map((trend, index) => {
              const x = index * pointSpacing;
              const y = calculatePosition(trend.avg_speed_seconds, maxValue);
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="1.5"
                  className="data-point student-point"
                  fill="#667eea"
                />
              );
            })}
          </svg>

          {/* X-axis labels */}
          <div className="chart-x-axis">
            {trends.map((trend, index) => {
              if (index % Math.ceil(trends.length / 5) === 0 || index === trends.length - 1) {
                return (
                  <span
                    key={index}
                    className="x-axis-label"
                    style={{ left: `${(index / (trends.length - 1)) * 100}%` }}
                  >
                    {formatDate(trend.snapshot_date)}
                  </span>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>
    );
  };

  const calculateImprovement = (): string | null => {
    if (trends.length < 2) return null;

    const firstSpeed = trends[0].avg_speed_seconds;
    const lastSpeed = trends[trends.length - 1].avg_speed_seconds;
    const improvement = ((firstSpeed - lastSpeed) / firstSpeed) * 100;

    if (Math.abs(improvement) < 1) return null;

    return improvement > 0
      ? `${Math.abs(Math.round(improvement))}% 빨라짐 ⬆️`
      : `${Math.abs(Math.round(improvement))}% 느려짐 ⬇️`;
  };

  if (loading) {
    return (
      <div className="speed-trend-chart loading">
        <div className="spinner-small"></div>
        <p>추세 데이터 로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="speed-trend-chart error">
        <p className="error-text">{error}</p>
      </div>
    );
  }

  const improvement = calculateImprovement();

  return (
    <div className="speed-trend-chart">
      <div className="chart-header">
        <h3 className="chart-title">
          학습 속도 추이
          <span className="chart-subtitle">Speed Trend ({trendDays} days)</span>
        </h3>
        {improvement && <div className="improvement-badge">{improvement}</div>}
      </div>

      {renderChart()}

      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-color student-color"></div>
          <span>내 속도</span>
        </div>
        <div className="legend-item">
          <div className="legend-color cohort-color"></div>
          <span>반 평균</span>
        </div>
      </div>
    </div>
  );
};

export default SpeedTrendChart;
