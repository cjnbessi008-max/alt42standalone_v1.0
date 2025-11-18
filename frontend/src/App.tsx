/**
 * Core Integral - Main Application
 */

import React, { useState, useEffect } from 'react';
import { VirtualPhone } from './components/VirtualPhone';
import { IntegralDisplay } from './components/IntegralDisplay';
import { problemAPI } from './services/api';
import type { IntegralProblem } from './types';
import './App.css';

function App() {
  const [problems, setProblems] = useState<IntegralProblem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProblems();
  }, []);

  const loadProblems = async () => {
    try {
      setLoading(true);
      setError(null);

      // 샘플 문제 가져오기
      const sampleProblems = await problemAPI.getSampleProblems();

      // 각 샘플 문제를 분석하여 상세 정보 추가
      const analyzedProblems = await Promise.all(
        sampleProblems.map(async (problem) => {
          try {
            return await problemAPI.analyzeProblem(problem.latex, problem.problemText);
          } catch (err) {
            console.error('문제 분석 실패:', err);
            return problem;
          }
        })
      );

      setProblems(analyzedProblems);
    } catch (err) {
      console.error('문제 로드 실패:', err);
      setError('문제를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleNextProblem = () => {
    if (currentProblemIndex < problems.length - 1) {
      setCurrentProblemIndex(currentProblemIndex + 1);
      setCurrentStep(0);
    }
  };

  const handlePrevProblem = () => {
    if (currentProblemIndex > 0) {
      setCurrentProblemIndex(currentProblemIndex - 1);
      setCurrentStep(0);
    }
  };

  const handleNextStep = () => {
    const currentProblem = problems[currentProblemIndex];
    if (currentProblem?.steps && currentStep < currentProblem.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentProblem = problems[currentProblemIndex];

  return (
    <div className="app">
      {/* 데스크톱 정보 패널 */}
      <div className="desktop-panel">
        <div className="panel-header">
          <h1>🧮 Core Integral Highlighting System</h1>
          <p className="panel-subtitle">
            Moodle LMS 연동 적분 문제 학습 시스템
          </p>
        </div>

        <div className="panel-content">
          <div className="info-card">
            <h2>시스템 정보</h2>
            <ul className="info-list">
              <li>
                <strong>LMS 연동:</strong> Moodle 3.7, PHP 7.1.9, MySQL 5.7
              </li>
              <li>
                <strong>기능:</strong> 적분 핵심 규칙 자동 강조
              </li>
              <li>
                <strong>표시 위치:</strong> 우측 하단 가상 스마트폰
              </li>
              <li>
                <strong>수학 렌더링:</strong> MathJax 3
              </li>
            </ul>
          </div>

          <div className="info-card">
            <h2>현재 문제 정보</h2>
            {loading ? (
              <p className="loading-text">문제를 불러오는 중...</p>
            ) : error ? (
              <p className="error-text">{error}</p>
            ) : currentProblem ? (
              <>
                <p>
                  <strong>문제 번호:</strong> {currentProblemIndex + 1} / {problems.length}
                </p>
                <p>
                  <strong>난이도:</strong>{' '}
                  <span className={`difficulty-${currentProblem.difficulty}`}>
                    {currentProblem.difficulty}
                  </span>
                </p>
                <p>
                  <strong>유형:</strong> {currentProblem.integralType}
                </p>
                {currentProblem.steps && (
                  <p>
                    <strong>현재 단계:</strong> {currentStep + 1} /{' '}
                    {currentProblem.steps.length}
                  </p>
                )}
              </>
            ) : (
              <p>문제가 없습니다.</p>
            )}
          </div>

          <div className="controls-card">
            <h2>컨트롤</h2>
            <div className="button-group">
              <button
                onClick={handlePrevProblem}
                disabled={currentProblemIndex === 0 || loading}
                className="control-button"
              >
                ← 이전 문제
              </button>
              <button
                onClick={handleNextProblem}
                disabled={currentProblemIndex >= problems.length - 1 || loading}
                className="control-button"
              >
                다음 문제 →
              </button>
            </div>
            <div className="button-group">
              <button
                onClick={handlePrevStep}
                disabled={currentStep === 0 || loading}
                className="control-button secondary"
              >
                ← 이전 단계
              </button>
              <button
                onClick={handleNextStep}
                disabled={
                  !currentProblem?.steps ||
                  currentStep >= currentProblem.steps.length - 1 ||
                  loading
                }
                className="control-button secondary"
              >
                다음 단계 →
              </button>
            </div>
            <button onClick={loadProblems} disabled={loading} className="control-button refresh">
              🔄 새로고침
            </button>
          </div>

          <div className="info-card">
            <h2>핵심 기능</h2>
            <ul className="feature-list">
              <li>✓ 거듭제곱, 삼각함수, 지수/로그 적분 자동 인식</li>
              <li>✓ 단계별 풀이 및 핵심 규칙 강조</li>
              <li>✓ 색상 기반 하이라이팅으로 학습 효과 향상</li>
              <li>✓ 가상 스마트폰 UI로 모바일 학습 경험 제공</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 가상 스마트폰 디스플레이 */}
      <VirtualPhone>
        {loading ? (
          <div className="phone-loading">
            <div className="spinner"></div>
            <p>문제를 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="phone-error">
            <p>❌ {error}</p>
            <button onClick={loadProblems} className="retry-button">
              다시 시도
            </button>
          </div>
        ) : currentProblem ? (
          <IntegralDisplay
            problem={currentProblem}
            showSteps={true}
            currentStep={currentStep}
          />
        ) : (
          <div className="phone-empty">
            <p>문제가 없습니다.</p>
          </div>
        )}
      </VirtualPhone>
    </div>
  );
}

export default App;
