/**
 * VectorMotionApp - Main Application Component
 * 벡터 모션 애니메이션을 표시하는 메인 앱 컴포넌트
 */

import React, { useEffect, useState } from 'react';
import VirtualPhone from '../components/VirtualPhone';
import VectorField from '../components/animations/VectorField';
import lmsService from '../services/lmsService';
import type { ProblemData } from '../types/vector';
import './VectorMotionApp.css';

export const VectorMotionApp: React.FC = () => {
  const [currentProblem, setCurrentProblem] = useState<ProblemData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 컴포넌트 마운트 시 문제 로드
  useEffect(() => {
    loadProblem();
  }, []);

  /**
   * LMS에서 문제 로드
   */
  const loadProblem = async () => {
    try {
      setLoading(true);
      setError(null);

      // URL 파라미터에서 문제 ID 가져오기
      const urlParams = new URLSearchParams(window.location.search);
      const problemId = urlParams.get('problemId');
      const courseId = urlParams.get('courseId');

      let problem: ProblemData;

      if (problemId) {
        // 특정 문제 로드
        problem = await lmsService.getProblem(problemId);
      } else if (courseId) {
        // 새 문제 생성
        problem = await lmsService.requestNewProblem(courseId, 'vector-addition');
      } else {
        // 데모 문제 표시
        problem = getDemoProblem();
      }

      setCurrentProblem(problem);
    } catch (err) {
      console.error('Failed to load problem:', err);
      setError('문제를 불러오는데 실패했습니다. 데모 문제를 표시합니다.');
      // 오류 시 데모 문제 표시
      setCurrentProblem(getDemoProblem());
    } finally {
      setLoading(false);
    }
  };

  /**
   * 데모 문제 생성
   */
  const getDemoProblem = (): ProblemData => {
    return {
      id: 'demo-1',
      title: '벡터의 덧셈',
      description: '두 벡터 A와 B를 더한 결과 벡터 C를 구하세요.',
      type: 'vector-addition',
      vectors: [
        {
          start: { x: 200, y: 300 },
          end: { x: 350, y: 250 },
          color: '#2563eb',
          label: 'A',
          animated: true,
          duration: 1000,
          delay: 0,
        },
        {
          start: { x: 350, y: 250 },
          end: { x: 400, y: 150 },
          color: '#dc2626',
          label: 'B',
          animated: true,
          duration: 1000,
          delay: 1000,
        },
        {
          start: { x: 200, y: 300 },
          end: { x: 400, y: 150 },
          color: '#16a34a',
          label: 'C (A + B)',
          animated: true,
          duration: 1500,
          delay: 2000,
          strokeWidth: 3,
        },
      ],
    };
  };

  /**
   * 답안 제출 핸들러
   */
  const handleSubmitAnswer = async (answer: any) => {
    if (!currentProblem) return;

    try {
      const result = await lmsService.submitAnswer(currentProblem.id, answer);
      alert(
        result.correct
          ? `정답입니다! 점수: ${result.score}`
          : `오답입니다. ${result.feedback}`
      );
    } catch (err) {
      console.error('Failed to submit answer:', err);
      alert('답안 제출에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>문제를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!currentProblem) {
    return (
      <div className="app-container">
        <div className="error">
          <p>문제를 찾을 수 없습니다.</p>
          <button onClick={loadProblem}>다시 시도</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* 메인 콘텐츠 */}
      <div className="main-content">
        <h1>{currentProblem.title}</h1>
        <p className="description">{currentProblem.description}</p>
        {error && <div className="error-banner">{error}</div>}
      </div>

      {/* 우측 하단 가상 스마트폰 */}
      <VirtualPhone position="bottom-right">
        <div className="phone-app">
          <div className="app-header">
            <h2>Vector Motion</h2>
          </div>
          <div className="app-content">
            <VectorField
              vectors={currentProblem.vectors}
              width={375}
              height={500}
              showGrid={true}
              gridSize={50}
            />
          </div>
          <div className="app-footer">
            <button
              className="btn-primary"
              onClick={() => handleSubmitAnswer(currentProblem.answer)}
            >
              답안 제출
            </button>
            <button className="btn-secondary" onClick={loadProblem}>
              다음 문제
            </button>
          </div>
        </div>
      </VirtualPhone>
    </div>
  );
};

export default VectorMotionApp;
