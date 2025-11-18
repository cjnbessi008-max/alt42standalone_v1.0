/**
 * Confidence Indicator Component
 *
 * Displays student confidence level with visual feedback
 * Can be used standalone or embedded in other components
 */

import React, { useEffect, useState } from 'react';
import './ConfidenceIndicator.css';

// ============================================
// Types
// ============================================

interface ConfidenceSummary {
  current_confidence: number;
  confidence_level: string;
  consecutive_correct: number;
  mastery_count: number;
  recommended_difficulty: number;
  recent_attempts: number;
  recent_correct: number;
  recent_accuracy: number;
  avg_time_seconds: number;
  last_attempt: string | null;
}

interface ConfidenceIndicatorProps {
  studentId: string;
  moduleId: string;
  apiBaseUrl?: string;
  showDetails?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

// ============================================
// Main Component
// ============================================

const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  studentId,
  moduleId,
  apiBaseUrl = 'http://localhost:8000',
  showDetails = true,
  autoRefresh = false,
  refreshInterval = 30000 // 30 seconds
}) => {
  const [summary, setSummary] = useState<ConfidenceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // Fetch Confidence Summary
  // ============================================

  const fetchSummary = async () => {
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/confidence/${studentId}/${moduleId}/summary`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch confidence summary');
      }

      const data = await response.json();
      setSummary(data);
      setError(null);
    } catch (err) {
      setError('자신감 정보를 불러올 수 없습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // Effects
  // ============================================

  useEffect(() => {
    fetchSummary();

    if (autoRefresh) {
      const interval = setInterval(fetchSummary, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [studentId, moduleId, autoRefresh, refreshInterval]);

  // ============================================
  // Helper Functions
  // ============================================

  const getConfidenceColor = (score: number): string => {
    if (score < 30) return '#ff4444';
    if (score < 50) return '#ff8800';
    if (score < 70) return '#ffaa00';
    if (score < 85) return '#88cc00';
    return '#44cc44';
  };

  const getConfidenceEmoji = (score: number): string => {
    if (score < 30) return '😟';
    if (score < 50) return '😐';
    if (score < 70) return '🙂';
    if (score < 85) return '😊';
    return '😄';
  };

  const getDifficultyStars = (level: number): string => {
    return '⭐'.repeat(level);
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}초`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}분 ${secs}초`;
  };

  // ============================================
  // Render
  // ============================================

  if (loading) {
    return (
      <div className="confidence-indicator loading">
        <div className="spinner-small"></div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="confidence-indicator error">
        <span>❌ {error || '정보 없음'}</span>
      </div>
    );
  }

  return (
    <div className="confidence-indicator">
      {/* Main Confidence Display */}
      <div
        className="confidence-main"
        style={{ borderColor: getConfidenceColor(summary.current_confidence) }}
      >
        <div className="confidence-emoji">
          {getConfidenceEmoji(summary.current_confidence)}
        </div>
        <div className="confidence-info">
          <div className="confidence-score-large">
            {summary.current_confidence.toFixed(0)}
          </div>
          <div className="confidence-score-label">자신감 점수</div>
        </div>
        <div className="confidence-bar-vertical">
          <div
            className="confidence-fill"
            style={{
              height: `${summary.current_confidence}%`,
              backgroundColor: getConfidenceColor(summary.current_confidence)
            }}
          />
        </div>
      </div>

      {/* Confidence Level Label */}
      <div
        className="confidence-level-badge"
        style={{ backgroundColor: getConfidenceColor(summary.current_confidence) }}
      >
        {summary.confidence_level}
      </div>

      {/* Detailed Stats */}
      {showDetails && (
        <div className="confidence-details">
          {/* Streak */}
          {summary.consecutive_correct > 0 && (
            <div className="detail-item highlight">
              <span className="detail-icon">🔥</span>
              <span className="detail-label">연속 정답</span>
              <span className="detail-value">{summary.consecutive_correct}개</span>
            </div>
          )}

          {/* Mastery Count */}
          <div className="detail-item">
            <span className="detail-icon">✅</span>
            <span className="detail-label">총 정답 수</span>
            <span className="detail-value">{summary.mastery_count}개</span>
          </div>

          {/* Recommended Difficulty */}
          <div className="detail-item">
            <span className="detail-icon">🎯</span>
            <span className="detail-label">권장 난이도</span>
            <span className="detail-value">
              {getDifficultyStars(summary.recommended_difficulty)}
            </span>
          </div>

          {/* Recent Performance */}
          {summary.recent_attempts > 0 && (
            <>
              <div className="detail-section-title">최근 7일 성과</div>

              <div className="detail-item">
                <span className="detail-icon">📊</span>
                <span className="detail-label">시도한 문제</span>
                <span className="detail-value">{summary.recent_attempts}개</span>
              </div>

              <div className="detail-item">
                <span className="detail-icon">✓</span>
                <span className="detail-label">맞춘 문제</span>
                <span className="detail-value">{summary.recent_correct}개</span>
              </div>

              <div className="detail-item">
                <span className="detail-icon">📈</span>
                <span className="detail-label">정확도</span>
                <span className="detail-value">
                  {summary.recent_accuracy.toFixed(0)}%
                </span>
              </div>

              {summary.avg_time_seconds > 0 && (
                <div className="detail-item">
                  <span className="detail-icon">⏱️</span>
                  <span className="detail-label">평균 풀이 시간</span>
                  <span className="detail-value">
                    {formatTime(summary.avg_time_seconds)}
                  </span>
                </div>
              )}
            </>
          )}

          {/* Last Attempt */}
          {summary.last_attempt && (
            <div className="detail-item subtle">
              <span className="detail-icon">🕒</span>
              <span className="detail-label">마지막 시도</span>
              <span className="detail-value">
                {new Date(summary.last_attempt).toLocaleString('ko-KR', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Refresh Button */}
      {!autoRefresh && (
        <button className="refresh-button" onClick={fetchSummary}>
          🔄 새로고침
        </button>
      )}
    </div>
  );
};

export default ConfidenceIndicator;
