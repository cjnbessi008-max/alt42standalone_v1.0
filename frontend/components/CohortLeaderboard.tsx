/**
 * Cohort Leaderboard Component
 * Displays rankings of students in a cohort
 */
import React, { useEffect, useState } from 'react';
import {
  speedComparisonApi,
  LeaderboardResponse,
  LeaderboardEntry,
} from '../services/speedComparisonApi';
import './CohortLeaderboard.css';

interface CohortLeaderboardProps {
  cohortId: string;
  moduleId: string;
  limit?: number;
  sortBy?: 'speed' | 'accuracy' | 'overall';
  anonymize?: boolean;
  showCurrentStudent?: boolean;
  currentStudentId?: string;
}

export const CohortLeaderboard: React.FC<CohortLeaderboardProps> = ({
  cohortId,
  moduleId,
  limit = 10,
  sortBy = 'overall',
  anonymize = true,
  showCurrentStudent = true,
  currentStudentId,
}) => {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSort, setSelectedSort] = useState<'speed' | 'accuracy' | 'overall'>(sortBy);

  useEffect(() => {
    loadLeaderboard();
  }, [cohortId, moduleId, limit, selectedSort, anonymize]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await speedComparisonApi.getLeaderboard(cohortId, moduleId, {
        limit,
        sortBy: selectedSort,
        anonymize,
      });

      setData(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || '리더보드를 불러오는데 실패했습니다.');
      console.error('Failed to load leaderboard:', err);
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

  const getMedalIcon = (rank: number): string => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const handleSortChange = (newSort: 'speed' | 'accuracy' | 'overall') => {
    setSelectedSort(newSort);
  };

  if (loading) {
    return (
      <div className="cohort-leaderboard loading">
        <div className="spinner"></div>
        <p>리더보드 로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cohort-leaderboard error">
        <p className="error-message">{error}</p>
        <button onClick={loadLeaderboard} className="retry-button">
          다시 시도
        </button>
      </div>
    );
  }

  if (!data || data.leaderboard.length === 0) {
    return (
      <div className="cohort-leaderboard empty">
        <p>🏆 아직 리더보드 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="cohort-leaderboard">
      <div className="leaderboard-header">
        <h3 className="leaderboard-title">
          🏆 리더보드
          <span className="leaderboard-subtitle">Leaderboard</span>
        </h3>

        <div className="sort-buttons">
          <button
            className={`sort-button ${selectedSort === 'overall' ? 'active' : ''}`}
            onClick={() => handleSortChange('overall')}
          >
            종합
          </button>
          <button
            className={`sort-button ${selectedSort === 'speed' ? 'active' : ''}`}
            onClick={() => handleSortChange('speed')}
          >
            속도
          </button>
          <button
            className={`sort-button ${selectedSort === 'accuracy' ? 'active' : ''}`}
            onClick={() => handleSortChange('accuracy')}
          >
            정확도
          </button>
        </div>
      </div>

      <div className="leaderboard-list">
        {data.leaderboard.map((entry, index) => {
          const rank = index + 1;
          const isCurrentStudent =
            showCurrentStudent && currentStudentId === entry.student_id;

          return (
            <div
              key={entry.student_id}
              className={`leaderboard-entry ${isCurrentStudent ? 'current-student' : ''} ${
                rank <= 3 ? 'top-three' : ''
              }`}
            >
              <div className="entry-rank">
                <span className="rank-number">{getMedalIcon(rank)}</span>
              </div>

              <div className="entry-info">
                <div className="entry-name">
                  {entry.student_name || `Student ${rank}`}
                  {isCurrentStudent && <span className="you-badge">나</span>}
                </div>
                <div className="entry-stats">
                  <span className="stat">
                    ⚡ {formatTime(entry.average_time_per_problem_seconds)}
                  </span>
                  <span className="stat-separator">•</span>
                  <span className="stat">
                    ✓ {Math.round(entry.accuracy_percentage)}%
                  </span>
                  <span className="stat-separator">•</span>
                  <span className="stat">{entry.total_problems_attempted}문제</span>
                </div>
              </div>

              {entry.percentile_rank !== undefined && (
                <div className="entry-percentile">
                  <span className="percentile-label">상위</span>
                  <span className="percentile-value">
                    {Math.round(100 - entry.percentile_rank)}%
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="leaderboard-footer">
        <button onClick={loadLeaderboard} className="refresh-button">
          🔄 새로고침
        </button>
        {anonymize && (
          <span className="anonymize-note">
            * 개인정보 보호를 위해 익명으로 표시됩니다
          </span>
        )}
      </div>
    </div>
  );
};

export default CohortLeaderboard;
