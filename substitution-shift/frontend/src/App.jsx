import React, { useState, useEffect } from 'react';
import SmartphoneSimulator from './components/SmartphoneSimulator';
import SubstitutionVisualizer from './components/SubstitutionVisualizer';
import axios from 'axios';
import './App.css';

/**
 * Main App Component
 *
 * Integrates smartphone simulator with substitution visualization
 * Fetches problems from backend API
 */
function App() {
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiBaseUrl] = useState(
    process.env.REACT_APP_API_URL || 'http://localhost/substitution-shift/backend/api'
  );

  // Get problem ID from URL parameters or use default
  const getProblemId = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const moodleId = urlParams.get('moodle_id');
    const problemId = urlParams.get('id');

    return { moodleId, problemId };
  };

  useEffect(() => {
    fetchProblem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProblem = async () => {
    setLoading(true);
    setError(null);

    try {
      const { moodleId, problemId } = getProblemId();

      let url;
      if (moodleId) {
        url = `${apiBaseUrl}/problems.php?moodle_id=${moodleId}`;
      } else if (problemId) {
        url = `${apiBaseUrl}/problems.php?id=${problemId}`;
      } else {
        // Get random problem if no ID specified
        url = `${apiBaseUrl}/problems.php?random=1`;
      }

      const response = await axios.get(url);

      if (response.data.success && response.data.data) {
        setProblem(response.data.data);
      } else {
        throw new Error('문제를 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('Error fetching problem:', err);
      setError(err.message || '서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    console.log('Visualization completed!');
    // Here you can send completion data to Moodle or backend
  };

  const handleRefresh = () => {
    fetchProblem();
  };

  return (
    <div className="app">
      {/* Main content area (optional - can show instructions, etc.) */}
      <div className="main-content">
        <header className="app-header">
          <h1>🔄 Substitution Shift</h1>
          <p className="tagline">치환적분을 색상으로 이해하다</p>
        </header>

        <div className="instructions">
          <h2>사용 방법</h2>
          <ul>
            <li>▶ 버튼을 클릭하여 자동 재생</li>
            <li>◀ ▶ 버튼으로 단계별 이동</li>
            <li>타임라인의 점을 클릭하여 특정 단계로 이동</li>
            <li>색상이 변하는 것을 주의깊게 관찰하세요</li>
          </ul>
        </div>

        {loading && (
          <div className="status-message">
            <div className="spinner"></div>
            <p>문제를 불러오는 중...</p>
          </div>
        )}

        {error && (
          <div className="status-message error">
            <p>❌ {error}</p>
            <button onClick={handleRefresh} className="retry-button">
              다시 시도
            </button>
          </div>
        )}
      </div>

      {/* Smartphone simulator in bottom right */}
      {!loading && !error && problem && (
        <SmartphoneSimulator position="bottom-right">
          <SubstitutionVisualizer
            problem={problem}
            onComplete={handleComplete}
          />
        </SmartphoneSimulator>
      )}
    </div>
  );
}

export default App;
