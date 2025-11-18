import React, { useState, useEffect } from 'react';
import { SmartphoneFrame } from './components/SmartphoneFrame';
import { OverlapSync } from './components/OverlapSync';
import { AnimationControls } from './components/AnimationControls';
import { mockLmsApi } from './services/lmsApi';
import { ProblemData } from './types';
import './App.css';

function App() {
  const [problems, setProblems] = useState<ProblemData[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProblems();
  }, []);

  const loadProblems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await mockLmsApi.getProblems();
      setProblems(data);
    } catch (err) {
      setError('문제 데이터를 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProblemChange = (index: number) => {
    setCurrentProblemIndex(index);
  };

  const handleNext = () => {
    if (currentProblemIndex < problems.length - 1) {
      setCurrentProblemIndex(currentProblemIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentProblemIndex > 0) {
      setCurrentProblemIndex(currentProblemIndex - 1);
    }
  };

  const handleComplete = () => {
    console.log('Animation completed!');
    // LMS에 완료 상태 전송
    if (problems[currentProblemIndex]) {
      mockLmsApi.completeProblem(
        'user-123',
        problems[currentProblemIndex].id,
        100
      );
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>문제 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error || problems.length === 0) {
    return (
      <div className="app-container">
        <div className="error-screen">
          <h2>⚠️ 오류 발생</h2>
          <p>{error || '문제 데이터가 없습니다.'}</p>
          <button onClick={loadProblems} className="retry-btn">
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const currentProblem = problems[currentProblemIndex];

  return (
    <div className="app-container">
      {/* 메인 콘텐츠 영역 */}
      <div className="main-content">
        <header className="app-header">
          <h1>🎯 Overlap Sync Animation</h1>
          <p className="subtitle">LMS 연동 도형 겹침 애니메이션 학습 시스템</p>
        </header>

        <div className="content-area">
          <div className="info-panel">
            <h2>📚 학습 모듈 정보</h2>
            <div className="info-card">
              <div className="info-row">
                <span className="info-label">총 문제 수:</span>
                <span className="info-value">{problems.length}개</span>
              </div>
              <div className="info-row">
                <span className="info-label">현재 문제:</span>
                <span className="info-value">
                  {currentProblemIndex + 1} / {problems.length}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">난이도:</span>
                <span className={`difficulty-tag ${currentProblem.difficulty}`}>
                  {currentProblem.difficulty === 'easy' && '🟢 쉬움'}
                  {currentProblem.difficulty === 'medium' && '🟡 보통'}
                  {currentProblem.difficulty === 'hard' && '🔴 어려움'}
                </span>
              </div>
            </div>

            <div className="problem-selector">
              <h3>문제 선택</h3>
              <div className="problem-list">
                {problems.map((problem, index) => (
                  <button
                    key={problem.id}
                    className={`problem-item ${index === currentProblemIndex ? 'active' : ''}`}
                    onClick={() => handleProblemChange(index)}
                  >
                    <span className="problem-number">{index + 1}</span>
                    <span className="problem-title">{problem.title}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="navigation-buttons">
              <button
                onClick={handlePrevious}
                disabled={currentProblemIndex === 0}
                className="nav-btn prev"
              >
                ← 이전
              </button>
              <button
                onClick={handleNext}
                disabled={currentProblemIndex === problems.length - 1}
                className="nav-btn next"
              >
                다음 →
              </button>
            </div>
          </div>

          <div className="description-panel">
            <h2>💡 시스템 설명</h2>
            <div className="description-content">
              <p>
                <strong>Overlap Sync Animation</strong>은 Moodle 3.7+ LMS와 연동하여
                도형 겹침 학습을 지원하는 인터랙티브 웹 애플리케이션입니다.
              </p>

              <h3>🎯 주요 기능</h3>
              <ul>
                <li>두 개 이상의 도형이 서서히 겹쳐지는 애니메이션</li>
                <li>실시간 진행률 및 겹침 비율 표시</li>
                <li>난이도별 문제 제공 (쉬움/보통/어려움)</li>
                <li>가상 스마트폰 화면 시뮬레이션</li>
                <li>LMS 진도 자동 저장</li>
              </ul>

              <h3>🔧 기술 스택</h3>
              <ul>
                <li><strong>Frontend:</strong> React 18 + TypeScript</li>
                <li><strong>Animation:</strong> Framer Motion</li>
                <li><strong>State:</strong> Zustand</li>
                <li><strong>API:</strong> Axios (LMS 연동)</li>
              </ul>

              <h3>📱 LMS 연동 정보</h3>
              <ul>
                <li><strong>Moodle 버전:</strong> 3.7+</li>
                <li><strong>PHP 버전:</strong> 7.1.9</li>
                <li><strong>Database:</strong> MySQL 5.7</li>
              </ul>

              <div className="tech-note">
                <strong>📝 참고:</strong> 우측 하단의 가상 스마트폰 화면에서
                애니메이션을 확인하세요. 재생 버튼을 눌러 애니메이션을 시작할 수 있습니다.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 우측 하단 가상 스마트폰 화면 */}
      <SmartphoneFrame position="bottom-right">
        <OverlapSync
          problem={currentProblem}
          autoPlay={false}
          onComplete={handleComplete}
        />
        <AnimationControls />
      </SmartphoneFrame>
    </div>
  );
}

export default App;
