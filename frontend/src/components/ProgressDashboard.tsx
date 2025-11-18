import { useState, useEffect } from 'react';
import { api, Student, LearningProgress } from '../api/client';
import './ProgressDashboard.css';

interface Props {
  student: Student;
}

export default function ProgressDashboard({ student }: Props) {
  const [progress, setProgress] = useState<LearningProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProgress();
  }, [student.id]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.getStudentProgress(student.id);
      setProgress(response.data);
    } catch (err) {
      console.error('Failed to load progress:', err);
      setError('진행 상황을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const overallStats = progress.reduce(
    (acc, p) => ({
      totalAttempts: acc.totalAttempts + p.total_attempts,
      correctAttempts: acc.correctAttempts + p.correct_attempts,
    }),
    { totalAttempts: 0, correctAttempts: 0 }
  );

  const overallAccuracy =
    overallStats.totalAttempts > 0
      ? (overallStats.correctAttempts / overallStats.totalAttempts) * 100
      : 0;

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="progress-dashboard">
      {/* Overall Stats */}
      <div className="card stats-card">
        <h2>📊 전체 통계</h2>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{overallStats.totalAttempts}</div>
            <div className="stat-label">총 시도</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{overallStats.correctAttempts}</div>
            <div className="stat-label">정답 수</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{overallAccuracy.toFixed(1)}%</div>
            <div className="stat-label">정확도</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{progress.length}</div>
            <div className="stat-label">학습한 유형</div>
          </div>
        </div>
      </div>

      {/* Progress by Type */}
      {progress.length === 0 ? (
        <div className="card">
          <p>아직 풀어본 문제가 없습니다. 문제를 풀기 시작하세요!</p>
        </div>
      ) : (
        <div className="card progress-list-card">
          <h2>📚 유형별 진행 상황</h2>
          <div className="progress-list">
            {progress
              .sort((a, b) => b.mastery_level - a.mastery_level)
              .map((p) => (
                <div key={p.id} className="progress-item">
                  <div className="progress-item-header">
                    <h3>{p.problem_type}</h3>
                    <span className="mastery-badge" data-level={getMasteryLevel(p.mastery_level)}>
                      {getMasteryLabel(p.mastery_level)}
                    </span>
                  </div>

                  <div className="progress-stats">
                    <span>정답률: {(p.accuracy_rate * 100).toFixed(1)}%</span>
                    <span>시도: {p.total_attempts}회</span>
                    <span>정답: {p.correct_attempts}회</span>
                  </div>

                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${p.mastery_level * 100}%`,
                        backgroundColor: getMasteryColor(p.mastery_level),
                      }}
                    />
                  </div>

                  {p.last_attempt_at && (
                    <div className="last-attempt">
                      마지막 시도: {new Date(p.last_attempt_at).toLocaleDateString('ko-KR')}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Strengths and Weaknesses */}
      {progress.length > 0 && (
        <div className="card insights-card">
          <h2>💪 강점과 약점</h2>
          <div className="insights-grid">
            <div className="insight-section">
              <h3>강점 (숙달도 80% 이상)</h3>
              {progress.filter((p) => p.mastery_level >= 0.8).length > 0 ? (
                <ul>
                  {progress
                    .filter((p) => p.mastery_level >= 0.8)
                    .map((p) => (
                      <li key={p.id} className="strength-item">
                        {p.problem_type} - {(p.mastery_level * 100).toFixed(0)}%
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="empty-state">아직 강점이 발견되지 않았습니다. 계속 연습하세요!</p>
              )}
            </div>

            <div className="insight-section">
              <h3>개선 필요 (숙달도 60% 미만)</h3>
              {progress.filter((p) => p.mastery_level < 0.6 && p.total_attempts >= 3).length > 0 ? (
                <ul>
                  {progress
                    .filter((p) => p.mastery_level < 0.6 && p.total_attempts >= 3)
                    .map((p) => (
                      <li key={p.id} className="weakness-item">
                        {p.problem_type} - {(p.mastery_level * 100).toFixed(0)}%
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="empty-state">개선이 필요한 영역이 없습니다. 잘하고 있어요!</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getMasteryLevel(level: number): string {
  if (level >= 0.9) return 'expert';
  if (level >= 0.7) return 'proficient';
  if (level >= 0.5) return 'developing';
  return 'beginner';
}

function getMasteryLabel(level: number): string {
  if (level >= 0.9) return '전문가';
  if (level >= 0.7) return '능숙';
  if (level >= 0.5) return '발전중';
  return '초보';
}

function getMasteryColor(level: number): string {
  if (level >= 0.9) return '#0f9d58';
  if (level >= 0.7) return '#1a73e8';
  if (level >= 0.5) return '#f9ab00';
  return '#d93025';
}
