/**
 * Demo Component for Grading Visual Effects
 * Shows example usage of GradingResult component with LMS integration
 */

import React, { useState } from 'react';
import GradingResultComponent from './GradingResult';
import { lmsApi } from '../api/lmsApi';
import { GradingResult } from '../types/grading';

export const GradingDemo: React.FC = () => {
  const [currentResult, setCurrentResult] = useState<GradingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [answer, setAnswer] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);

  const handleStartProblem = () => {
    setStartTime(Date.now());
    setCurrentResult(null);
    setAnswer('');
  };

  const handleSubmitAnswer = async (isCorrect: boolean) => {
    if (!startTime) {
      alert('먼저 문제를 시작하세요!');
      return;
    }

    setIsLoading(true);

    try {
      const timeSpent = (Date.now() - startTime) / 1000;

      // Submit to LMS API
      const response = await lmsApi.submitAnswer({
        studentId: 'student-demo-123',
        moduleId: 'module-fractions',
        problemId: 'problem-001',
        answer: answer,
        timeSpent: timeSpent,
      });

      setCurrentResult(response.gradingResult);
    } catch (error) {
      console.error('Failed to submit answer:', error);

      // Show demo result even if API fails
      const demoResult: GradingResult = {
        id: 'demo-result',
        studentId: 'student-demo-123',
        moduleId: 'module-fractions',
        problemId: 'problem-001',
        answer: answer,
        isCorrect: isCorrect,
        score: isCorrect ? 10 : 0,
        maxScore: 10,
        feedback: isCorrect
          ? '훌륭합니다! 분수의 개념을 정확히 이해하셨네요.'
          : '아쉽네요. 분자와 분모의 관계를 다시 한 번 생각해보세요.',
        timestamp: new Date(),
        timeSpent: timeSpent,
      };

      setCurrentResult(demoResult);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem', textAlign: 'center' }}>
        LMS 채점 시각 효과 데모
      </h1>

      {/* Problem Section */}
      <div style={{
        background: '#f5f5f5',
        padding: '2rem',
        borderRadius: '12px',
        marginBottom: '2rem'
      }}>
        <h2>문제: 분수의 덧셈</h2>
        <p style={{ fontSize: '1.2rem', margin: '1rem 0' }}>
          1/2 + 1/4 = ?
        </p>

        <div style={{ marginTop: '1.5rem' }}>
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="답을 입력하세요 (예: 3/4)"
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              borderRadius: '8px',
              border: '2px solid #ddd',
              marginBottom: '1rem'
            }}
            onFocus={handleStartProblem}
          />

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => handleSubmitAnswer(true)}
              disabled={isLoading || !answer}
              style={{
                flex: 1,
                padding: '0.75rem',
                fontSize: '1rem',
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isLoading || !answer ? 'not-allowed' : 'pointer',
                opacity: isLoading || !answer ? 0.5 : 1
              }}
            >
              정답으로 제출 (성공 펄스 효과)
            </button>

            <button
              onClick={() => handleSubmitAnswer(false)}
              disabled={isLoading || !answer}
              style={{
                flex: 1,
                padding: '0.75rem',
                fontSize: '1rem',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isLoading || !answer ? 'not-allowed' : 'pointer',
                opacity: isLoading || !answer ? 0.5 : 1
              }}
            >
              오답으로 제출 (오류 크랙 효과)
            </button>
          </div>
        </div>
      </div>

      {/* Result Section */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>채점 중...</p>
        </div>
      )}

      {currentResult && !isLoading && (
        <div style={{ marginTop: '2rem' }}>
          <GradingResultComponent
            result={currentResult}
            config={{
              showAnimation: true,
              animationDuration: 800,
              soundEnabled: false,
              accessibilityMode: false,
            }}
            onAnimationComplete={() => {
              console.log('Animation completed!');
            }}
          />
        </div>
      )}

      {/* Info Section */}
      <div style={{
        marginTop: '3rem',
        padding: '1.5rem',
        background: '#e3f2fd',
        borderRadius: '8px'
      }}>
        <h3>시각 효과 설명</h3>
        <ul style={{ lineHeight: '1.8' }}>
          <li>
            <strong>성공 펄스 효과:</strong> 정답 제출 시 초록색 펄스 애니메이션과
            빛나는 효과가 나타납니다.
          </li>
          <li>
            <strong>오류 크랙 효과:</strong> 오답 제출 시 빨간색 크랙 라인과
            흔들림 효과가 나타납니다.
          </li>
          <li>
            <strong>접근성:</strong> prefers-reduced-motion 설정 시 애니메이션이
            비활성화됩니다.
          </li>
          <li>
            <strong>LMS 연동:</strong> 채점 결과는 자동으로 LMS에 동기화됩니다.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default GradingDemo;
