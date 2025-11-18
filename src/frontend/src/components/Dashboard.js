import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import {
  getRecommendations,
  getProgressStats,
  getProgress,
  logout
} from '../utils/api';

function Dashboard({ user, onUserUpdate }) {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState(null);
  const [stats, setStats] = useState(null);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [recsData, statsData, progressData] = await Promise.all([
        getRecommendations(),
        getProgressStats(),
        getProgress()
      ]);
      setRecommendations(recsData);
      setStats(statsData);
      setProgress(progressData);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const handleStartSequence = (sequenceId) => {
    navigate(`/visualize/${sequenceId}`);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>대시보드 로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Geo Spiral</h1>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => navigate('/leaderboard')}>
              리더보드
            </button>
            <button className="btn btn-ghost" onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-main">
        {/* User Info Card */}
        <div className="user-card">
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="user-info">
            <h2>{user?.name || 'User'}</h2>
            <p className="user-username">@{user?.username}</p>
            <div className="user-level">
              <span className="level-badge">Level {user?.level || 1}</span>
              <span className="role-badge">{user?.role}</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📚</div>
              <div className="stat-value">{stats.completed_sequences || 0}</div>
              <div className="stat-label">완료한 수열</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-value">{Math.round(stats.average_score) || 0}%</div>
              <div className="stat-label">평균 점수</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏱️</div>
              <div className="stat-value">{Math.round((stats.total_time_spent || 0) / 60)}</div>
              <div className="stat-label">총 학습 시간 (분)</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-value">{stats.total_interactions || 0}</div>
              <div className="stat-label">상호작용 횟수</div>
            </div>
          </div>
        )}

        {/* Recommendations Section */}
        {recommendations && (
          <div className="recommendations-section">
            <div className="section-header">
              <h2>🤖 맞춤 추천</h2>
              <p className="recommendation-reason">{recommendations.recommendation_reason}</p>
            </div>

            {/* In Progress Sequences */}
            {recommendations.in_progress && recommendations.in_progress.length > 0 && (
              <div className="sequences-group">
                <h3>진행 중인 수열</h3>
                <div className="sequences-grid">
                  {recommendations.in_progress.map((seq) => (
                    <div key={seq.id} className="sequence-card in-progress" onClick={() => handleStartSequence(seq.id)}>
                      <div className="sequence-header">
                        <h4>{seq.name}</h4>
                        <span className="difficulty-badge level-{seq.difficulty_level}">
                          Level {seq.difficulty_level}
                        </span>
                      </div>
                      <p className="sequence-description">{seq.description}</p>
                      <div className="sequence-meta">
                        <span>공비: {seq.common_ratio || 'N/A'}</span>
                        <span>{seq.spiral_type}</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${seq.score || 30}%` }}></div>
                      </div>
                      <button className="sequence-btn">계속하기 →</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Sequences */}
            <div className="sequences-group">
              <h3>추천 수열</h3>
              <div className="sequences-grid">
                {recommendations.recommended.map((seq) => (
                  <div key={seq.id} className="sequence-card" onClick={() => handleStartSequence(seq.id)}>
                    <div className="sequence-header">
                      <h4>{seq.name}</h4>
                      <span className={`difficulty-badge level-${seq.difficulty_level}`}>
                        Level {seq.difficulty_level}
                      </span>
                    </div>
                    <p className="sequence-description">{seq.description}</p>
                    <div className="sequence-meta">
                      <span>공비: {seq.common_ratio || 'N/A'}</span>
                      <span>{seq.spiral_type}</span>
                    </div>
                    {seq.popularity > 0 && (
                      <div className="sequence-stats">
                        👥 {seq.popularity}명 완료 | ⭐ {Math.round(seq.avg_score)}%
                      </div>
                    )}
                    <button className="sequence-btn">시작하기 →</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Progress */}
        {progress && progress.length > 0 && (
          <div className="recent-progress-section">
            <h2>최근 학습 활동</h2>
            <div className="progress-list">
              {progress.slice(0, 5).map((item) => (
                <div key={item.id} className="progress-item">
                  <div className="progress-item-icon">
                    {item.completion_status === 'completed' ? '✅' : '📖'}
                  </div>
                  <div className="progress-item-content">
                    <h4>{item.sequence_name}</h4>
                    <div className="progress-item-meta">
                      <span>{item.completion_status === 'completed' ? '완료' : '진행 중'}</span>
                      {item.score && <span>점수: {item.score}%</span>}
                      <span>{Math.round(item.time_spent / 60)}분</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
