import React from 'react';
import { Problem, RelationType } from '../types';

interface ProblemCardProps {
  problem: Problem;
  selectedRelation: RelationType | null;
  onSelectRelation: (relation: RelationType) => void;
  confidenceLevel: number;
  onConfidenceChange: (level: number) => void;
  onSubmit: () => void;
  currentIndex: number;
  totalProblems: number;
}

const relationOptions: { value: RelationType; label: string; symbol: string }[] = [
  { value: 'SUBSET', label: '부분집합', symbol: 'A ⊆ B' },
  { value: 'SUPERSET', label: '초집합', symbol: 'A ⊇ B' },
  { value: 'EQUAL', label: '같음', symbol: 'A = B' },
  { value: 'DISJOINT', label: '서로소', symbol: 'A ∩ B = ∅' },
  { value: 'INTERSECT', label: '교집합 존재', symbol: 'A ∩ B ≠ ∅' },
];

const ProblemCard: React.FC<ProblemCardProps> = ({
  problem,
  selectedRelation,
  onSelectRelation,
  onSubmit,
  currentIndex,
  totalProblems,
}) => {
  return (
    <div className="w-full h-full overflow-y-auto bg-white p-5">
      {/* 진행 상황 */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>문제 진행</span>
          <span>
            {currentIndex + 1} / {totalProblems}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalProblems) * 100}%` }}
          />
        </div>
      </div>

      {/* 문제 제목 */}
      <h2 className="text-lg font-bold text-gray-800 mb-2">{problem.title}</h2>

      {/* 문제 설명 */}
      {problem.description && (
        <p className="text-sm text-gray-600 mb-4">{problem.description}</p>
      )}

      {/* 집합 표시 */}
      <div className="flex justify-around mb-6">
        <div className="text-center">
          <div className="text-sm font-semibold text-primary-600 mb-2">집합 A</div>
          <div className="bg-primary-50 border-2 border-primary-500 rounded-lg p-3 min-w-[100px]">
            <div className="text-base font-mono">
              {'{'}
              {problem.setA.join(', ')}
              {'}'}
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm font-semibold text-secondary-600 mb-2">집합 B</div>
          <div className="bg-secondary-50 border-2 border-secondary-500 rounded-lg p-3 min-w-[100px]">
            <div className="text-base font-mono">
              {'{'}
              {problem.setB.join(', ')}
              {'}'}
            </div>
          </div>
        </div>
      </div>

      {/* 관계 선택 버튼 */}
      <div className="space-y-2 mb-6">
        <p className="text-sm font-medium text-gray-700 mb-2">
          두 집합의 관계를 선택하세요:
        </p>
        {relationOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onSelectRelation(option.value)}
            className={`w-full p-3 rounded-lg border-2 transition-all ${
              selectedRelation === option.value
                ? 'bg-primary-500 border-primary-600 text-white shadow-md'
                : 'bg-white border-gray-300 text-gray-700 hover:border-primary-400 hover:bg-primary-50'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">{option.label}</span>
              <span className="text-sm font-mono">{option.symbol}</span>
            </div>
          </button>
        ))}
      </div>

      {/* 제출 버튼 */}
      <button
        onClick={onSubmit}
        disabled={!selectedRelation}
        className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
          selectedRelation
            ? 'bg-primary-500 hover:bg-primary-600 active:scale-95'
            : 'bg-gray-300 cursor-not-allowed'
        }`}
      >
        제출
      </button>
    </div>
  );
};

export default ProblemCard;
