import React from 'react';
import { RelationType } from '../types';

interface ResultCardProps {
  isCorrect: boolean;
  selectedAnswer: RelationType;
  correctAnswer: RelationType;
  confidenceLevel: number;
  onNext: () => void;
}

const relationLabels: Record<RelationType, string> = {
  SUBSET: '부분집합 (A ⊆ B)',
  SUPERSET: '초집합 (A ⊇ B)',
  EQUAL: '같음 (A = B)',
  DISJOINT: '서로소 (A ∩ B = ∅)',
  INTERSECT: '교집합 존재 (A ∩ B ≠ ∅)',
};

const ResultCard: React.FC<ResultCardProps> = ({
  isCorrect,
  selectedAnswer,
  correctAnswer,
  confidenceLevel,
  onNext,
}) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-white">
      {/* 결과 아이콘 */}
      <div
        className={`text-6xl mb-4 ${
          isCorrect ? 'text-green-500' : 'text-red-500'
        }`}
      >
        {isCorrect ? '✓' : '✗'}
      </div>

      {/* 결과 메시지 */}
      <h2
        className={`text-2xl font-bold mb-4 ${
          isCorrect ? 'text-green-600' : 'text-red-600'
        }`}
      >
        {isCorrect ? '정답입니다!' : '오답입니다'}
      </h2>

      {/* 상세 정보 */}
      <div className="w-full bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">선택한 답:</span>
          <span className="font-semibold">{relationLabels[selectedAnswer]}</span>
        </div>
        {!isCorrect && (
          <div className="flex justify-between">
            <span className="text-gray-600">정답:</span>
            <span className="font-semibold text-green-600">
              {relationLabels[correctAnswer]}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-600">확신도:</span>
          <span className="font-semibold">{confidenceLevel}%</span>
        </div>
      </div>

      {/* 다음 버튼 */}
      <button
        onClick={onNext}
        className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg transition-all active:scale-95"
      >
        다음 문제
      </button>
    </div>
  );
};

export default ResultCard;
