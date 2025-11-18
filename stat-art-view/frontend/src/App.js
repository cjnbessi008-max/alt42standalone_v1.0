import React, { useState, useEffect } from 'react';
import './App.css';
import MobileViewport from './components/MobileViewport';
import Dashboard from './components/Dashboard';
import { statsAPI } from './services/api';

function App() {
  const [quizId, setQuizId] = useState(100); // 기본값: 샘플 퀴즈 ID
  const [artData, setArtData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadArtData();
  }, [quizId]);

  const loadArtData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await statsAPI.getArtData(quizId);
      setArtData(response.data);
    } catch (err) {
      console.error('Failed to load art data:', err);
      setError('데이터를 불러오는데 실패했습니다. 백엔드 서버를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuizChange = (e) => {
    setQuizId(e.target.value);
  };

  return (
    <div className="App">
      {/* 헤더 */}
      <header className="app-header">
        <h1>📊 Stat Art View</h1>
        <p>통계를 아트워크처럼 시각화하는 교육 대시보드</p>
      </header>

      {/* 컨트롤 패널 */}
      <div className="control-panel">
        <div className="control-group">
          <label htmlFor="quiz-select">퀴즈 선택:</label>
          <select
            id="quiz-select"
            value={quizId}
            onChange={handleQuizChange}
            className="quiz-selector"
          >
            <option value="100">분수의 이해 퀴즈</option>
            <option value="101">도형의 넓이 퀴즈</option>
          </select>
          <button onClick={loadArtData} className="refresh-btn">
            🔄 새로고침
          </button>
        </div>

        {artData && (
          <div className="stats-summary">
            <div className="stat-item">
              <span className="stat-label">전체 문제:</span>
              <span className="stat-value">{artData.summary.totalQuestions}개</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">평균 정답률:</span>
              <span className="stat-value">
                {artData.summary.averageCorrectRate.toFixed(1)}%
              </span>
            </div>
            <div className="stat-item difficulty-easy">
              <span className="stat-label">쉬움:</span>
              <span className="stat-value">{artData.summary.difficultyBreakdown.easy}개</span>
            </div>
            <div className="stat-item difficulty-medium">
              <span className="stat-label">보통:</span>
              <span className="stat-value">{artData.summary.difficultyBreakdown.medium}개</span>
            </div>
            <div className="stat-item difficulty-hard">
              <span className="stat-label">어려움:</span>
              <span className="stat-value">{artData.summary.difficultyBreakdown.hard}개</span>
            </div>
          </div>
        )}
      </div>

      {/* 메인 대시보드 영역 */}
      <div className="main-content">
        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>데이터 로딩 중...</p>
          </div>
        )}

        {error && (
          <div className="error-container">
            <p className="error-message">⚠️ {error}</p>
            <button onClick={loadArtData} className="retry-btn">
              다시 시도
            </button>
          </div>
        )}

        {!loading && !error && artData && (
          <Dashboard artData={artData} />
        )}
      </div>

      {/* 우측 하단: 모바일 뷰포트 (스마트폰 화면) */}
      <MobileViewport artData={artData} loading={loading} />

      {/* 푸터 */}
      <footer className="app-footer">
        <p>KAIST Touch Math Academy - AI Education System</p>
      </footer>
    </div>
  );
}

export default App;
