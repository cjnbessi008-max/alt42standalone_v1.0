import React, { useState, useEffect } from 'react';
import { SmartphoneDisplay } from './components/SmartphoneDisplay';
import { SimilarityType, MoodleProblem } from './types/similarity';
import { fetchProblems } from './services/moodleService';
import './styles/App.css';

/**
 * Main Application Component
 * Moodle LMS와 연동하여 닮음 조건 학습 앱
 */
function App() {
  const [currentProblem, setCurrentProblem] = useState<MoodleProblem | null>(null);
  const [activeSimilarity, setActiveSimilarity] = useState<SimilarityType | null>(null);
  const [problems, setProblems] = useState<MoodleProblem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load problems from Moodle on mount
  useEffect(() => {
    loadProblems();
  }, []);

  const loadProblems = async () => {
    try {
      setLoading(true);
      const data = await fetchProblems();
      setProblems(data);

      // Set first problem as current
      if (data.length > 0) {
        setCurrentProblem(data[0]);
        setActiveSimilarity(data[0].similarityType);
      }
    } catch (error) {
      console.error('Failed to load problems:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (type: SimilarityType) => {
    setActiveSimilarity(type);
    console.log('Selected similarity type:', type);
  };

  const handleNextProblem = () => {
    if (problems.length === 0) return;

    const currentIndex = problems.findIndex(p => p.id === currentProblem?.id);
    const nextIndex = (currentIndex + 1) % problems.length;
    const nextProblem = problems[nextIndex];

    setCurrentProblem(nextProblem);
    setActiveSimilarity(nextProblem.similarityType);
  };

  const handlePrevProblem = () => {
    if (problems.length === 0) return;

    const currentIndex = problems.findIndex(p => p.id === currentProblem?.id);
    const prevIndex = currentIndex === 0 ? problems.length - 1 : currentIndex - 1;
    const prevProblem = problems[prevIndex];

    setCurrentProblem(prevProblem);
    setActiveSimilarity(prevProblem.similarityType);
  };

  return (
    <div className="app">
      {/* Background gradient */}
      <div className="app-background">
        <div className="gradient-circle circle-1"></div>
        <div className="gradient-circle circle-2"></div>
        <div className="gradient-circle circle-3"></div>
      </div>

      {/* Main content */}
      <div className="app-content">
        <header className="app-header">
          <h1 className="app-title">
            <span className="title-icon">📐</span>
            Similarity Cards
          </h1>
          <p className="app-subtitle">삼각형 닮음 조건 학습 시스템</p>
          <div className="app-info">
            <span className="info-badge">Moodle LMS 연동</span>
            <span className="info-badge">실시간 학습</span>
          </div>
        </header>

        <main className="app-main">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">문제를 불러오는 중...</p>
            </div>
          ) : currentProblem ? (
            <div className="problem-container">
              <div className="problem-card">
                <div className="problem-header">
                  <span className="problem-number">문제 #{currentProblem.id}</span>
                  <span className={`difficulty-badge ${currentProblem.difficulty}`}>
                    {currentProblem.difficulty === 'easy' ? '쉬움' :
                     currentProblem.difficulty === 'medium' ? '보통' : '어려움'}
                  </span>
                </div>

                <h2 className="problem-title">{currentProblem.title}</h2>
                <p className="problem-content">{currentProblem.content}</p>

                <div className="problem-type">
                  <span className="type-label">닮음 조건:</span>
                  <span className="type-value">{currentProblem.similarityType}</span>
                </div>

                <div className="problem-controls">
                  <button
                    className="control-btn prev"
                    onClick={handlePrevProblem}
                    disabled={problems.length <= 1}
                  >
                    ← 이전 문제
                  </button>
                  <button
                    className="control-btn next"
                    onClick={handleNextProblem}
                    disabled={problems.length <= 1}
                  >
                    다음 문제 →
                  </button>
                </div>
              </div>

              <div className="info-panel">
                <h3 className="panel-title">학습 가이드</h3>
                <ul className="guide-list">
                  <li>우측 하단 스마트폰 화면에서 닮음 조건 카드를 확인하세요</li>
                  <li>각 카드를 클릭하여 자세한 설명을 볼 수 있습니다</li>
                  <li>현재 문제에 해당하는 닮음 조건이 강조 표시됩니다</li>
                  <li>이전/다음 버튼으로 다른 문제를 풀어보세요</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="no-problems">
              <p className="no-problems-text">표시할 문제가 없습니다.</p>
              <button className="reload-btn" onClick={loadProblems}>
                다시 시도
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Smartphone display - right bottom corner */}
      <SmartphoneDisplay
        activeSimilarity={activeSimilarity}
        onCardClick={handleCardClick}
        position="bottom-right"
      />
    </div>
  );
}

export default App;
