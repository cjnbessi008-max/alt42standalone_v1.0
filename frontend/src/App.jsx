import React, { useState, useEffect } from 'react';
import SmartphoneFrame from './components/SmartphoneFrame';
import SmoothIntervalVisualization from './components/SmoothIntervalVisualization';
import { problemAPI } from './services/api';
import './App.css';

function App() {
  const [problems, setProblems] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load problems on mount
  useEffect(() => {
    loadProblems();
  }, []);

  /**
   * Load all problems from API
   */
  const loadProblems = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await problemAPI.getAll();

      if (response.success && response.data.length > 0) {
        setProblems(response.data);

        // Load first problem with details
        const firstProblem = await problemAPI.getById(response.data[0].id);
        if (firstProblem.success) {
          setSelectedProblem(firstProblem.data);
        }
      } else {
        setError('문제를 찾을 수 없습니다.');
      }
    } catch (err) {
      console.error('Failed to load problems:', err);
      setError('문제를 불러오는데 실패했습니다. 서버가 실행중인지 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Select a problem
   */
  const selectProblem = async (problemId) => {
    try {
      const response = await problemAPI.getById(problemId);
      if (response.success) {
        setSelectedProblem(response.data);
      }
    } catch (err) {
      console.error('Failed to load problem:', err);
      setError('문제를 불러오는데 실패했습니다.');
    }
  };

  return (
    <div className="app">
      {/* Main dashboard */}
      <div className="dashboard">
        <header className="dashboard-header">
          <h1>🎓 Smooth Interval</h1>
          <p>미분 가능한 구간 시각화 시스템</p>
        </header>

        <div className="dashboard-content">
          {loading ? (
            <div className="status-message">
              <div className="spinner"></div>
              <p>문제를 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="status-message error">
              <p>⚠️ {error}</p>
              <button onClick={loadProblems} className="retry-button">
                다시 시도
              </button>
            </div>
          ) : (
            <div className="problems-grid">
              <h2>📚 문제 목록</h2>
              <div className="problems-list">
                {problems.map(problem => (
                  <div
                    key={problem.id}
                    className={`problem-card ${selectedProblem?.id === problem.id ? 'active' : ''}`}
                    onClick={() => selectProblem(problem.id)}
                  >
                    <div className="problem-card-header">
                      <h3>{problem.title}</h3>
                      <span className={`difficulty ${problem.difficulty_level}`}>
                        {problem.difficulty_level === 'easy' ? '쉬움' :
                         problem.difficulty_level === 'medium' ? '보통' : '어려움'}
                      </span>
                    </div>
                    <p className="problem-function">
                      f(x) = {problem.function_expression}
                    </p>
                    {problem.moodle_problem_id && (
                      <span className="moodle-badge">
                        📖 Moodle: {problem.moodle_problem_id}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {selectedProblem && (
                <div className="problem-details">
                  <h2>📊 상세 정보</h2>
                  <div className="detail-card">
                    <div className="detail-row">
                      <strong>제목:</strong>
                      <span>{selectedProblem.title}</span>
                    </div>
                    <div className="detail-row">
                      <strong>함수:</strong>
                      <code>{selectedProblem.function_expression}</code>
                    </div>
                    <div className="detail-row">
                      <strong>정의역:</strong>
                      <span>[{selectedProblem.domain_start}, {selectedProblem.domain_end}]</span>
                    </div>
                    <div className="detail-row">
                      <strong>구간 수:</strong>
                      <span>{selectedProblem.intervals?.length || 0}개</span>
                    </div>
                    <div className="detail-row">
                      <strong>미분가능 구간:</strong>
                      <span>
                        {selectedProblem.intervals?.filter(i => i.is_differentiable).length || 0}개
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="system-info">
                <h3>🔧 시스템 정보</h3>
                <ul>
                  <li>✅ Backend API 연결됨</li>
                  <li>✅ MySQL 5.7 데이터베이스</li>
                  <li>✅ Moodle 3.7 통합 지원</li>
                  <li>✅ React 18 + Canvas 시각화</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Smartphone display (right bottom) */}
      <SmartphoneFrame>
        <SmoothIntervalVisualization problem={selectedProblem} />
      </SmartphoneFrame>
    </div>
  );
}

export default App;
