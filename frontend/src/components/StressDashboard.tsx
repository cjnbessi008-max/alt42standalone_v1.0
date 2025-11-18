/**
 * Stress Dashboard Component
 * 학습 스트레스 대시보드 컴포넌트
 */

import React, { useState, useEffect } from 'react';
import { StressMetrics } from '../types';
import stressAPI from '../api';
import './StressDashboard.css';

interface StressDashboardProps {
  moduleId?: string;
}

const StressDashboard: React.FC<StressDashboardProps> = ({ moduleId }) => {
  const [metrics, setMetrics] = useState<StressMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, [moduleId]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await stressAPI.getStressMetrics(moduleId);
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '메트릭 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="stress-dashboard loading">
        <div className="spinner" />
        <p>데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stress-dashboard error">
        <p>오류: {error}</p>
        <button onClick={fetchMetrics}>다시 시도</button>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="stress-dashboard empty">
        <p>데이터가 없습니다.</p>
      </div>
    );
  }

  const lowPercentage = metrics.total_students > 0
    ? (metrics.low_stress_count / metrics.total_students) * 100
    : 0;
  const mediumPercentage = metrics.total_students > 0
    ? (metrics.medium_stress_count / metrics.total_students) * 100
    : 0;
  const highPercentage = metrics.total_students > 0
    ? (metrics.high_stress_count / metrics.total_students) * 100
    : 0;

  return (
    <div className="stress-dashboard">
      <div className="dashboard-header">
        <h2>학습 스트레스 통계</h2>
        <button className="refresh-button" onClick={fetchMetrics}>
          새로고침
        </button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">👥</div>
          <div className="metric-content">
            <p className="metric-label">총 학생 수</p>
            <p className="metric-value">{metrics.total_students}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <p className="metric-label">평균 스트레스 점수</p>
            <p className="metric-value">{metrics.average_stress_score.toFixed(1)}</p>
          </div>
        </div>
      </div>

      <div className="stress-distribution">
        <h3>스트레스 레벨 분포</h3>

        <div className="distribution-bars">
          <div className="distribution-item">
            <div className="distribution-header">
              <span className="distribution-label">
                <span className="emoji">😊</span> 낮음
              </span>
              <span className="distribution-count">
                {metrics.low_stress_count}명 ({lowPercentage.toFixed(1)}%)
              </span>
            </div>
            <div className="distribution-bar">
              <div
                className="distribution-fill low"
                style={{ width: `${lowPercentage}%` }}
              />
            </div>
          </div>

          <div className="distribution-item">
            <div className="distribution-header">
              <span className="distribution-label">
                <span className="emoji">😐</span> 보통
              </span>
              <span className="distribution-count">
                {metrics.medium_stress_count}명 ({mediumPercentage.toFixed(1)}%)
              </span>
            </div>
            <div className="distribution-bar">
              <div
                className="distribution-fill medium"
                style={{ width: `${mediumPercentage}%` }}
              />
            </div>
          </div>

          <div className="distribution-item">
            <div className="distribution-header">
              <span className="distribution-label">
                <span className="emoji">😰</span> 높음
              </span>
              <span className="distribution-count">
                {metrics.high_stress_count}명 ({highPercentage.toFixed(1)}%)
              </span>
            </div>
            <div className="distribution-bar">
              <div
                className="distribution-fill high"
                style={{ width: `${highPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {metrics.high_stress_count > 0 && (
          <div className="alert-box">
            <span className="alert-icon">⚠️</span>
            <p>
              {metrics.high_stress_count}명의 학생이 높은 스트레스를 보이고 있습니다.
              교사의 개입이 필요할 수 있습니다.
            </p>
          </div>
        )}
      </div>

      <div className="dashboard-footer">
        <p className="last-updated">
          마지막 업데이트: {new Date(metrics.timestamp).toLocaleString('ko-KR')}
        </p>
      </div>
    </div>
  );
};

export default StressDashboard;
