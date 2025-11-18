import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Leaderboard.css';
import { getLeaderboard } from '../utils/api';

function Leaderboard() {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await getLeaderboard();
      setLeaderboard(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (loading) {
    return (
      <div className="leaderboard-loading">
        <div className="spinner"></div>
        <p>리더보드 로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard-error">
        <h2>오류 발생</h2>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={loadLeaderboard}>
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      <header className="leaderboard-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← 홈으로
        </button>
        <h1>🏆 리더보드</h1>
        <p>최고의 학습자들을 만나보세요</p>
      </header>

      <div className="leaderboard-main">
        {leaderboard.length === 0 ? (
          <div className="empty-leaderboard">
            <div className="empty-icon">📊</div>
            <h2>아직 순위가 없습니다</h2>
            <p>첫 번째 순위에 도전해보세요!</p>
            <button className="btn btn-primary" onClick={() => navigate('/register')}>
              시작하기
            </button>
          </div>
        ) : (
          <div className="leaderboard-list">
            {leaderboard.map((user, index) => (
              <div
                key={user.id}
                className={`leaderboard-item ${index < 3 ? 'top-rank' : ''} rank-${index + 1}`}
              >
                <div className="rank-badge">
                  {getMedalEmoji(index + 1)}
                </div>

                <div className="user-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>

                <div className="user-details">
                  <h3>{user.name}</h3>
                  <p>@{user.username}</p>
                </div>

                <div className="user-stats">
                  <div className="stat">
                    <span className="stat-value">{user.completed_sequences}</span>
                    <span className="stat-label">완료</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{Math.round(user.avg_score)}%</span>
                    <span className="stat-label">평균 점수</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">L{user.level}</span>
                    <span className="stat-label">레벨</span>
                  </div>
                </div>

                {index < 3 && (
                  <div className="medal-glow"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
