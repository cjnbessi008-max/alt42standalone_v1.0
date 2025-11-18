/**
 * ALT42 Standalone - Main App Component
 * Asymptote Reveal 애니메이션 웹앱
 */

import React, { useState, useEffect, useRef } from 'react';
import GraphCanvas from './components/GraphCanvas';
import MobilePhoneFrame from './components/MobilePhoneFrame';
import { ProblemAPI } from './api/problem-api';
import { ProblemData } from './types/problem';
import { useTouchGestures } from './hooks/useTouchGestures';
import './styles/App.css';

const App: React.FC = () => {
  const [problemData, setProblemData] = useState<ProblemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizId, setQuizId] = useState<number | null>(null);
  const touchAreaRef = useRef<HTMLDivElement>(null);

  /**
   * 문제 데이터 로드
   */
  useEffect(() => {
    loadProblem();
  }, []);

  const loadProblem = async () => {
    setLoading(true);
    setError(null);

    try {
      // URL 파라미터에서 quiz_id 확인
      const params = new URLSearchParams(window.location.search);
      const quizIdParam = params.get('quiz_id');

      let data: ProblemData | null = null;

      if (quizIdParam) {
        const id = parseInt(quizIdParam, 10);
        setQuizId(id);
        data = await ProblemAPI.getQuizProblem(id);
      } else {
        // 샘플 데이터
        data = await ProblemAPI.getSampleProblem();
      }

      if (data) {
        setProblemData(data);
      } else {
        setError('문제 데이터를 불러올 수 없습니다.');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 터치 제스처 핸들러
   */
  useTouchGestures(touchAreaRef, {
    onPinch: (scale) => {
      console.log('Pinch zoom:', scale);
      // 줌 기능은 향후 추가 가능
    },
    onPan: (deltaX, deltaY) => {
      console.log('Pan:', deltaX, deltaY);
      // 팬 기능은 향후 추가 가능
    },
    onDoubleTap: (x, y) => {
      console.log('Double tap at:', x, y);
      // 더블 탭으로 점근선 토글 가능
    }
  });

  /**
   * 새 문제 불러오기
   */
  const loadNewProblem = async (id: number) => {
    setLoading(true);
    const data = await ProblemAPI.getCustomProblem(id);
    if (data) {
      setProblemData(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>문제를 불러오는 중...</p>
      </div>
    );
  }

  if (error || !problemData) {
    return (
      <div className="app-error">
        <h2>오류</h2>
        <p>{error || '문제를 불러올 수 없습니다.'}</p>
        <button onClick={loadProblem}>다시 시도</button>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>ALT42 - Asymptote Reveal</h1>
        <p className="subtitle">점근선 애니메이션 시각화</p>
      </header>

      <main className="app-main">
        <div className="desktop-view">
          <div className="problem-info">
            <h2>{problemData.question_name || '수학 문제'}</h2>
            <p className="instruction">
              아래 그래프에서 점근선이 천천히 나타나는 것을 관찰하세요.
            </p>
          </div>

          <div className="graph-container" ref={touchAreaRef}>
            <GraphCanvas
              problemData={problemData}
              width={700}
              height={700}
              showAsymptotes={true}
              animateAsymptotes={true}
            />
          </div>

          <div className="controls">
            <button onClick={loadProblem} className="btn-primary">
              애니메이션 다시 보기
            </button>
            <button onClick={() => loadNewProblem(1)} className="btn-secondary">
              다른 문제 보기
            </button>
          </div>
        </div>

        {/* 우측 하단 가상 스마트폰 */}
        <MobilePhoneFrame>
          <div className="mobile-content">
            <h3 className="mobile-title">
              {problemData.question_name || '점근선 찾기'}
            </h3>
            <GraphCanvas
              problemData={problemData}
              width={330}
              height={550}
              showAsymptotes={true}
              animateAsymptotes={true}
            />
          </div>
        </MobilePhoneFrame>
      </main>

      <footer className="app-footer">
        <p>Powered by Canvas API & React | Moodle 3.7 연동</p>
      </footer>
    </div>
  );
};

export default App;
