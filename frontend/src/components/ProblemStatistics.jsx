import React, { useState, useEffect } from 'react';
import { timeTrackingAPI } from '../services/api';
import './ProblemStatistics.css';

/**
 * ProblemStatistics Component
 * 문제별 통계를 표시하는 컴포넌트
 */
export function ProblemStatistics({ problemId }) {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const response = await timeTrackingAPI.getProblemStatistics(problemId);
        setStatistics(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching statistics:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (problemId) {
      fetchStatistics();
    }
  }, [problemId]);

  const formatTime = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="statistics-loading">통계를 불러오는 중...</div>;
  }

  if (error) {
    return <div className="statistics-error">오류: {error}</div>;
  }

  if (!statistics) {
    return <div className="statistics-empty">통계 데이터가 없습니다.</div>;
  }

  return (
    <div className="problem-statistics">
      <h3 className="statistics-title">{statistics.title}</h3>

      <div className="statistics-grid">
        <div className="stat-card">
          <div className="stat-label">총 시도 횟수</div>
          <div className="stat-value">{statistics.total_attempts || 0}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">평균 소요 시간</div>
          <div className="stat-value">{formatTime(statistics.avg_time_seconds)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">평균 활동 시간</div>
          <div className="stat-value">{formatTime(statistics.avg_active_time_seconds)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">최단 시간</div>
          <div className="stat-value">{formatTime(statistics.min_time_seconds)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">최장 시간</div>
          <div className="stat-value">{formatTime(statistics.max_time_seconds)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">정답률</div>
          <div className="stat-value">
            {statistics.success_rate ? `${Number(statistics.success_rate).toFixed(1)}%` : '0%'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">평균 상호작용</div>
          <div className="stat-value">
            {statistics.avg_interactions ? Number(statistics.avg_interactions).toFixed(1) : '0'}
          </div>
        </div>
      </div>
    </div>
  );
}
