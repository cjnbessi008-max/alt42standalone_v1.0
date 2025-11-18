/**
 * Step Display Component
 * 부등식 단순화의 각 단계를 표시하는 컴포넌트
 */

import React from 'react';
import type { SimplificationStep } from '../types';
import MathExpression from './MathExpression';

interface StepDisplayProps {
  step: SimplificationStep;
  isActive: boolean;
  isCompleted: boolean;
}

export const StepDisplay: React.FC<StepDisplayProps> = ({
  step,
  isActive,
  isCompleted,
}) => {
  return (
    <div
      className={`
        relative p-4 mb-4 rounded-lg border-2 transition-all duration-300
        ${isActive ? 'border-kaist-blue bg-kaist-light shadow-lg scale-105' : ''}
        ${isCompleted && !isActive ? 'border-green-500 bg-green-50' : ''}
        ${!isActive && !isCompleted ? 'border-gray-200 bg-white opacity-60' : ''}
      `}
    >
      {/* 단계 번호 */}
      <div className="absolute -left-3 -top-3 w-8 h-8 rounded-full bg-kaist-blue text-white flex items-center justify-center font-bold text-sm">
        {step.id + 1}
      </div>

      {/* 완료 체크 표시 */}
      {isCompleted && !isActive && (
        <div className="absolute -right-2 -top-2 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}

      {/* 수학 표현식 */}
      <div className="mb-3 text-center py-4 bg-white rounded">
        <MathExpression
          expression={step.latex}
          displayMode={true}
          className="text-2xl"
        />
      </div>

      {/* 설명 */}
      <div className="space-y-1">
        <p className="text-sm font-semibold text-gray-700">{step.explanation}</p>
        <p className="text-xs text-gray-500 italic">{step.operation}</p>
      </div>

      {/* 최종 답안 표시 */}
      {step.isSimplified && (
        <div className="mt-3 p-2 bg-yellow-100 border-l-4 border-yellow-500 rounded">
          <p className="text-xs font-semibold text-yellow-800">✨ 최종 답안</p>
        </div>
      )}
    </div>
  );
};

export default StepDisplay;
