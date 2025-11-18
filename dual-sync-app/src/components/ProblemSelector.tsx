import React, { useState, useEffect } from 'react';
import { Problem } from '../types/equation.types';
import { useEquationStore } from '../store/equationStore';
import problemsData from '../data/problems.json';

const ProblemSelector: React.FC = () => {
  const [problems] = useState<Problem[]>(problemsData as Problem[]);
  const { currentProblem, setCurrentProblem, setEquation } = useEquationStore();

  useEffect(() => {
    // 초기 문제 로드
    if (problems.length > 0 && !currentProblem) {
      handleProblemSelect(problems[0]);
    }
  }, [problems]);

  const handleProblemSelect = (problem: Problem) => {
    setCurrentProblem(problem);
    setEquation(problem.equation);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">문제 선택</h3>

      <div className="space-y-2 max-h-40 overflow-y-auto">
        {problems.map((problem) => (
          <button
            key={problem.id}
            onClick={() => handleProblemSelect(problem)}
            className={`w-full text-left p-2 rounded-lg transition-colors ${
              currentProblem?.id === problem.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="text-xs font-medium">{problem.title}</div>
            <div className="text-xs opacity-75 truncate">{problem.description}</div>
          </button>
        ))}
      </div>

      {currentProblem && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="text-xs font-semibold text-blue-900 mb-1">문제 설명</h4>
          <p className="text-xs text-blue-800">{currentProblem.description}</p>

          {currentProblem.hints && currentProblem.hints.length > 0 && (
            <div className="mt-2">
              <h5 className="text-xs font-semibold text-blue-900 mb-1">힌트</h5>
              <ul className="text-xs text-blue-800 list-disc list-inside">
                {currentProblem.hints.map((hint, index) => (
                  <li key={index}>{hint}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProblemSelector;
