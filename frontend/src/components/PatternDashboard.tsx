/**
 * Pattern Dashboard Component
 * Shows student's mistake pattern analysis and statistics
 */
import React, { useEffect, useState } from 'react';
import { MistakePattern, PatternSummary } from '../types';
import apiService from '../services/api';
import './PatternDashboard.css';

interface PatternDashboardProps {
  studentId: string;
  moduleId?: string;
}

const PatternDashboard: React.FC<PatternDashboardProps> = ({ studentId, moduleId }) => {
  const [summary, setSummary] = useState<PatternSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadSummary();
  }, [studentId, moduleId]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const data = await apiService.getPatternSummary(studentId, moduleId);
      setSummary(data);
      setError(null);
    } catch (err) {
      setError('패턴 요약을 불러오는데 실패했습니다');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    try {
      setAnalyzing(true);
      await apiService.analyzePatterns(studentId, { module_id: moduleId });
      await loadSummary(); // Reload after analysis
    } catch (err) {
      setError('패턴 분석에 실패했습니다');
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return <div className="dashboard-loading">패턴 분석 결과를 불러오는 중...</div>;
  }

  if (error) {
    return <div className="dashboard-error">{error}</div>;
  }

  if (!summary) {
    return <div className="dashboard-empty">데이터가 없습니다</div>;
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="pattern-dashboard">
      <div className="dashboard-header">
        <h2>학습 패턴 분석</h2>
        <button
          onClick={runAnalysis}
          disabled={analyzing}
          className="analyze-button"
        >
          {analyzing ? '분석 중...' : '🔄 새로 분석'}
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{summary.total_patterns}</div>
          <div className="stat-label">발견된 패턴</div>
        </div>

        <div className="stat-card severity-high">
          <div className="stat-value">{summary.severity_breakdown.high}</div>
          <div className="stat-label">높은 우선순위</div>
        </div>

        <div className="stat-card severity-medium">
          <div className="stat-value">{summary.severity_breakdown.medium}</div>
          <div className="stat-label">중간 우선순위</div>
        </div>

        <div className="stat-card severity-low">
          <div className="stat-value">{summary.severity_breakdown.low}</div>
          <div className="stat-label">낮은 우선순위</div>
        </div>
      </div>

      {Object.keys(summary.by_category).length > 0 && (
        <div className="category-section">
          <h3>카테고리별 분포</h3>
          <div className="category-list">
            {Object.entries(summary.by_category).map(([category, count]) => (
              <div key={category} className="category-item">
                <span className="category-name">{category}</span>
                <span className="category-count">{count}개</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.patterns.length > 0 && (
        <div className="patterns-section">
          <h3>상세 패턴 목록</h3>
          <div className="patterns-list">
            {summary.patterns.map((pattern) => (
              <div key={pattern.id} className="pattern-item">
                <div
                  className="pattern-severity-indicator"
                  style={{ backgroundColor: getSeverityColor(pattern.severity) }}
                />
                <div className="pattern-content">
                  <div className="pattern-header">
                    <span className="pattern-type">{pattern.pattern_type}</span>
                    <span className="pattern-frequency">
                      {pattern.frequency}회 발생
                    </span>
                  </div>
                  <p className="pattern-description">{pattern.description}</p>
                  {pattern.problem_types.length > 0 && (
                    <div className="pattern-tags">
                      {pattern.problem_types.map((type, index) => (
                        <span key={index} className="pattern-tag">
                          {type}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatternDashboard;
