import React, { useEffect, useState } from 'react';
import { useAppStore } from './stores/appStore';
import VirtualPhone from './components/VirtualPhone/VirtualPhone';
import ProblemView from './components/ProblemView/ProblemView';
import './App.css';

function App() {
  const {
    currentSession,
    currentProblem,
    isLoading,
    error,
    initSession,
    loadProblem,
    clearError,
  } = useAppStore();

  const [sessionStats, setSessionStats] = useState({
    total_attempted: 0,
    total_correct: 0,
    accuracy: 0,
  });

  useEffect(() => {
    // Initialize session on mount
    const init = async () => {
      await initSession();
      await loadProblem();
    };
    init();
  }, []);

  useEffect(() => {
    // Update stats when session changes
    if (currentSession) {
      setSessionStats({
        total_attempted: currentSession.total_problems_attempted || 0,
        total_correct: currentSession.total_correct_answers || 0,
        accuracy:
          currentSession.total_problems_attempted && currentSession.total_problems_attempted > 0
            ? Math.round(
                ((currentSession.total_correct_answers || 0) /
                  currentSession.total_problems_attempted) *
                  100
              )
            : 0,
      });
    }
  }, [currentSession]);

  const handleNewProblem = () => {
    loadProblem();
  };

  return (
    <div className="app">
      {/* Dashboard (Left Side) */}
      <div className="dashboard">
        <div className="dashboard-header">
          <h1 className="app-title">🌸 Mathematical Garden</h1>
          <p className="app-subtitle">숫자를 정원으로 시각화하며 배우는 수학</p>
        </div>

        <div className="dashboard-content">
          {/* Session Info */}
          {currentSession && (
            <div className="stats-card animate-fade-in">
              <h3 className="stats-title">학습 통계</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{sessionStats.total_attempted}</div>
                  <div className="stat-label">시도한 문제</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{sessionStats.total_correct}</div>
                  <div className="stat-label">정답</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{sessionStats.accuracy}%</div>
                  <div className="stat-label">정확도</div>
                </div>
              </div>
            </div>
          )}

          {/* Problem Info */}
          {currentProblem && (
            <div className="info-card animate-fade-in">
              <h3 className="info-title">현재 문제</h3>
              <div className="info-content">
                <div className="info-row">
                  <span className="info-label">유형:</span>
                  <span className="info-value">{currentProblem.problem_type}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">난이도:</span>
                  <span className={`badge difficulty-${currentProblem.difficulty_level}`}>
                    {currentProblem.difficulty_level}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">대상 학년:</span>
                  <span className="info-value">{currentProblem.target_grade}학년</span>
                </div>
              </div>
              <button className="new-problem-button" onClick={handleNewProblem}>
                새 문제 불러오기
              </button>
            </div>
          )}

          {/* Instructions */}
          <div className="instructions-card">
            <h3 className="instructions-title">사용 방법</h3>
            <ol className="instructions-list">
              <li>우측 가상 스마트폰 화면에서 정원의 오브제를 관찰하세요</li>
              <li>각 오브제는 숫자를 나타냅니다</li>
              <li>문제를 읽고 정답을 입력하세요</li>
              <li>오브제를 클릭하여 상호작용할 수 있습니다</li>
            </ol>
          </div>

          {/* Error Display */}
          {error && (
            <div className="error-card animate-slide-up">
              <div className="error-message">{error}</div>
              <button className="error-close" onClick={clearError}>
                닫기
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Virtual Phone (Right Side) */}
      <div className="phone-section">
        <VirtualPhone showNotch={true}>
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <div className="loading-text">불러오는 중...</div>
            </div>
          ) : currentProblem ? (
            <ProblemView problem={currentProblem} />
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🌱</div>
              <div className="empty-text">문제를 불러오는 중입니다...</div>
            </div>
          )}
        </VirtualPhone>
      </div>
    </div>
  );
}

export default App;
