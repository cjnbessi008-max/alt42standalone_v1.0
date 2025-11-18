import React, { useState, useEffect } from 'react';
import SmartphoneFrame from './components/SmartphoneFrame';
import ProblemList from './components/ProblemList';
import VectorStoryMode from './components/VectorStoryMode';
import './App.css';

function App() {
  const [problems, setProblems] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/problems');
      const data = await response.json();

      if (data.success) {
        setProblems(data.problems);
      } else {
        setError('문제를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError('서버 연결에 실패했습니다. 백엔드 서버가 실행 중인지 확인해주세요.');
      console.error('Error fetching problems:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProblemSelect = (problem) => {
    setSelectedProblem(problem);
  };

  const handleBack = () => {
    setSelectedProblem(null);
  };

  return (
    <div className="app">
      <div className="app-header fade-in">
        <h1>🎯 ALT42 Vector Story Mode</h1>
        <p>벡터의 직관을 스토리 영상처럼 배워보세요</p>
      </div>

      <SmartphoneFrame>
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>문제를 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button onClick={fetchProblems} className="retry-button">
              다시 시도
            </button>
          </div>
        ) : selectedProblem ? (
          <VectorStoryMode
            problem={selectedProblem}
            onBack={handleBack}
          />
        ) : (
          <ProblemList
            problems={problems}
            onSelect={handleProblemSelect}
          />
        )}
      </SmartphoneFrame>
    </div>
  );
}

export default App;
