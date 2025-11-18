/**
 * Simplify Bridge - Main Component
 * 복잡한 부등식을 단계적으로 단순화하는 메인 컴포넌트
 */

import React, { useState, useEffect } from 'react';
import type { SimplificationStep } from '../types';
import { simplifyInequality } from '../utils/inequalitySimplifier';
import StepDisplay from './StepDisplay';

interface SimplifyBridgeProps {
  initialInequality?: string;
  autoPlay?: boolean;
  stepDelay?: number;
}

export const SimplifyBridge: React.FC<SimplifyBridgeProps> = ({
  initialInequality = '2x + 5 < 3x - 1',
  autoPlay = false,
  stepDelay = 2000,
}) => {
  const [steps, setSteps] = useState<SimplificationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [inputInequality, setInputInequality] = useState(initialInequality);

  // 부등식 단순화 실행
  const handleSimplify = () => {
    try {
      const simplifiedSteps = simplifyInequality(inputInequality);
      setSteps(simplifiedSteps);
      setCurrentStepIndex(0);
      setIsPlaying(false);
    } catch (error) {
      console.error('단순화 오류:', error);
      alert('부등식을 파싱할 수 없습니다. 올바른 형식인지 확인해주세요.');
    }
  };

  // 초기 로드 시 단순화 실행
  useEffect(() => {
    handleSimplify();
  }, []);

  // 자동 재생
  useEffect(() => {
    if (isPlaying && currentStepIndex < steps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1);
      }, stepDelay);

      return () => clearTimeout(timer);
    } else if (currentStepIndex >= steps.length - 1) {
      setIsPlaying(false);
    }
  }, [isPlaying, currentStepIndex, steps.length, stepDelay]);

  // 다음 단계
  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  // 이전 단계
  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  // 재생/일시정지
  const togglePlay = () => {
    if (currentStepIndex >= steps.length - 1) {
      setCurrentStepIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  // 리셋
  const handleReset = () => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* 헤더 */}
      <div className="bg-kaist-blue text-white p-4 shadow-lg">
        <h1 className="text-lg font-bold text-center">Simplify Bridge</h1>
        <p className="text-xs text-center mt-1 opacity-90">부등식 단계별 단순화</p>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 입력 섹션 */}
        <div className="mb-4 bg-white rounded-lg shadow p-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            부등식 입력
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputInequality}
              onChange={(e) => setInputInequality(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kaist-blue text-sm"
              placeholder="예: 2x + 5 < 3x - 1"
            />
            <button
              onClick={handleSimplify}
              className="px-4 py-2 bg-kaist-blue text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
            >
              계산
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            예제: 2x + 5 &lt; 3x - 1, 5x - 3 &gt;= 2x + 9, -2x + 4 &lt;= x - 5
          </p>
        </div>

        {/* 진행 상태 */}
        {steps.length > 0 && (
          <div className="mb-4 bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-700">
                진행도: {currentStepIndex + 1} / {steps.length}
              </span>
              <span className="text-xs text-gray-500">
                {Math.round(((currentStepIndex + 1) / steps.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-kaist-blue h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* 단계 표시 */}
        <div className="space-y-2">
          {steps.map((step, index) => (
            <StepDisplay
              key={step.id}
              step={step}
              isActive={index === currentStepIndex}
              isCompleted={index < currentStepIndex}
            />
          ))}
        </div>
      </div>

      {/* 컨트롤 버튼 */}
      {steps.length > 0 && (
        <div className="bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={handleReset}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              title="처음으로"
            >
              <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="이전 단계"
            >
              <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            <button
              onClick={togglePlay}
              className="p-3 bg-kaist-blue hover:bg-blue-700 text-white rounded-lg transition-colors"
              title={isPlaying ? '일시정지' : '자동 재생'}
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            <button
              onClick={handleNext}
              disabled={currentStepIndex >= steps.length - 1}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="다음 단계"
            >
              <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimplifyBridge;
