/**
 * Main App Component
 * Similarity Warm - 닮음 학습 시스템
 */

import React, { useEffect, useState } from 'react';
import { VirtualSmartphone } from '@components/VirtualSmartphone';
import { ProblemDisplay } from '@components/ProblemDisplay';
import { moodleApi } from '@services/moodleApi';
import { ProblemData, SimilarityCondition } from '@types/index';
import './App.css';

function App() {
  const [problems, setProblems] = useState<ProblemData[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [isWarm, setIsWarm] = useState(false);
  const [loading, setLoading] = useState(true);

  // 문제 데이터 로드
  useEffect(() => {
    loadProblems();
  }, []);

  const loadProblems = async () => {
    setLoading(true);
    const response = await moodleApi.getProblems();

    if (response.success && response.data) {
      setProblems(response.data);
    }
    setLoading(false);
  };

  const handleSubmit = async (condition: SimilarityCondition | null, ratio?: number) => {
    const currentProblem = problems[currentProblemIndex];

    if (!currentProblem) return;

    // 답안 제출
    const response = await moodleApi.submitAnswer(currentProblem.id, {
      selectedCondition: condition,
      calculatedRatio: ratio,
    });

    if (response.success && response.data?.correct) {
      // 정답이면 Warm 모드 활성화
      setIsWarm(true);

      // 3초 후 Warm 모드 해제
      setTimeout(() => {
        setIsWarm(false);
      }, 3000);

      // 진행 상황 저장
      await moodleApi.saveProgress(currentProblem.id, true);
    }
  };

  const handleNextProblem = () => {
    if (currentProblemIndex < problems.length - 1) {
      setCurrentProblemIndex(currentProblemIndex + 1);
      setIsWarm(false);
    }
  };

  const handlePrevProblem = () => {
    if (currentProblemIndex > 0) {
      setCurrentProblemIndex(currentProblemIndex - 1);
      setIsWarm(false);
    }
  };

  const currentProblem = problems[currentProblemIndex];

  return (
    <div className="app">
      {/* 메인 콘텐츠 영역 */}
      <div className="main-content">
        <header className="app-header">
          <h1 className="app-title">Similarity Warm</h1>
          <p className="app-subtitle">닮음 조건 학습 시스템</p>
        </header>

        <div className="content-area">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>문제를 불러오는 중...</p>
            </div>
          ) : problems.length === 0 ? (
            <div className="empty-state">
              <p>문제가 없습니다.</p>
              <button onClick={loadProblems} className="reload-btn">
                다시 불러오기
              </button>
            </div>
          ) : (
            <div className="problem-container">
              <div className="problem-navigation">
                <button
                  onClick={handlePrevProblem}
                  disabled={currentProblemIndex === 0}
                  className="nav-btn"
                >
                  ← 이전
                </button>
                <span className="problem-counter">
                  {currentProblemIndex + 1} / {problems.length}
                </span>
                <button
                  onClick={handleNextProblem}
                  disabled={currentProblemIndex === problems.length - 1}
                  className="nav-btn"
                >
                  다음 →
                </button>
              </div>

              <div className="desktop-problem-view">
                {currentProblem && (
                  <ProblemDisplay
                    problem={currentProblem}
                    onSubmit={handleSubmit}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 우측 하단 가상 스마트폰 */}
      <VirtualSmartphone isWarm={isWarm}>
        {currentProblem ? (
          <ProblemDisplay
            problem={currentProblem}
            onSubmit={handleSubmit}
          />
        ) : (
          <div className="smartphone-empty">
            <p>문제를 선택하세요</p>
          </div>
        )}
      </VirtualSmartphone>
    </div>
  );
}

export default App;
