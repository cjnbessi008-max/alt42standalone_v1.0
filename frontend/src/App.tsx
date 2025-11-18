/**
 * Scale Sound 메인 애플리케이션
 * 닮음 배율과 음높이를 연결하는 인터랙티브 수학 교육 앱
 */

import React, { useState, useEffect } from 'react';
import { SmartphoneSimulator } from './components/SmartphoneSimulator/SmartphoneSimulator';
import { ShapeDisplay } from './components/ShapeDisplay/ShapeDisplay';
import { ScaleControl } from './components/ScaleControl/ScaleControl';
import { ScaleCalculator } from './services/scaleCalculator';
import { moodleAPI } from './services/moodleAPI';
import { Shape, Problem } from './types';
import './App.css';

const App: React.FC = () => {
  // 상태 관리
  const [scale, setScale] = useState<number>(1.0);
  const [originalShape, setOriginalShape] = useState<Shape | null>(null);
  const [scaledShape, setScaledShape] = useState<Shape | null>(null);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * 초기화: 문제 목록 로드
   */
  useEffect(() => {
    initializeApp();
  }, []);

  /**
   * 앱 초기화
   */
  const initializeApp = async (): Promise<void> => {
    try {
      setIsLoading(true);

      // 기본 도형 생성 (샘플)
      const defaultShape = ScaleCalculator.createRectangle(
        75, 150, 200, 300, '#3498db'
      );
      setOriginalShape(defaultShape);
      setScaledShape(defaultShape);

      // Moodle에서 문제 목록 가져오기 (선택사항)
      try {
        const problemList = await moodleAPI.getProblems();
        setProblems(problemList);

        if (problemList.length > 0) {
          loadProblem(problemList[0]);
        }
      } catch (error) {
        console.warn('Moodle 연동 실패, 기본 도형 사용:', error);
      }
    } catch (error) {
      console.error('앱 초기화 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 문제 로드
   */
  const loadProblem = (problem: Problem): void => {
    setCurrentProblem(problem);
    setOriginalShape(problem.original_shape);
    setScaledShape(problem.original_shape);
    setScale(1.0);
  };

  /**
   * 배율 변경 핸들러
   */
  const handleScaleChange = (newScale: number): void => {
    setScale(newScale);

    if (originalShape) {
      const scaled = ScaleCalculator.scaleShape(originalShape, newScale);
      setScaledShape(scaled);
    }
  };

  /**
   * 문제 변경 핸들러
   */
  const handleProblemChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const problemId = parseInt(event.target.value);
    const problem = problems.find(p => p.id === problemId);

    if (problem) {
      loadProblem(problem);
    }
  };

  /**
   * 샘플 도형 변경
   */
  const changeSampleShape = (shapeType: 'rectangle' | 'triangle'): void => {
    let newShape: Shape;

    if (shapeType === 'rectangle') {
      newShape = ScaleCalculator.createRectangle(
        75, 150, 200, 300, '#3498db'
      );
    } else {
      newShape = ScaleCalculator.createTriangle(
        175, 310, 200, '#e74c3c'
      );
    }

    setOriginalShape(newShape);
    setScaledShape(ScaleCalculator.scaleShape(newShape, scale));
  };

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="app">
      {/* 헤더 */}
      <header className="app-header">
        <h1>🎵 Scale Sound</h1>
        <p className="app-subtitle">닮음 배율과 음높이를 체험하세요</p>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="app-content">
        {/* 좌측 패널: 컨트롤 */}
        <div className="left-panel">
          <ScaleControl
            initialScale={scale}
            minScale={currentProblem?.scale_range_min || 0.5}
            maxScale={currentProblem?.scale_range_max || 3.0}
            onScaleChange={handleScaleChange}
            soundEnabled={true}
          />

          {/* 문제 선택 */}
          {problems.length > 0 && (
            <div className="problem-selector">
              <h3>문제 선택</h3>
              <select onChange={handleProblemChange} value={currentProblem?.id || ''}>
                {problems.map(problem => (
                  <option key={problem.id} value={problem.id}>
                    {problem.title}
                  </option>
                ))}
              </select>
              {currentProblem && (
                <p className="problem-description">{currentProblem.description}</p>
              )}
            </div>
          )}

          {/* 샘플 도형 변경 */}
          <div className="shape-selector">
            <h3>도형 선택</h3>
            <div className="shape-buttons">
              <button
                className="btn btn-shape"
                onClick={() => changeSampleShape('rectangle')}
              >
                사각형
              </button>
              <button
                className="btn btn-shape"
                onClick={() => changeSampleShape('triangle')}
              >
                삼각형
              </button>
            </div>
          </div>
        </div>

        {/* 우측: 스마트폰 시뮬레이터 */}
        <SmartphoneSimulator position="bottom-right">
          {originalShape && scaledShape && (
            <ShapeDisplay
              originalShape={originalShape}
              scaledShape={scaledShape}
              scale={scale}
              showGrid={true}
            />
          )}
        </SmartphoneSimulator>
      </div>

      {/* 푸터 */}
      <footer className="app-footer">
        <p>KAIST Touch Math Academy - AI Education System</p>
        <p className="footer-tech">React + TypeScript + Web Audio API + Moodle 3.7</p>
      </footer>
    </div>
  );
};

export default App;
