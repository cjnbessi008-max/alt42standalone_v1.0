import React from 'react';
import { motion } from 'framer-motion';
import type { Problem } from '../types';

interface ProblemDisplayProps {
  problem: Problem;
  onDerivative: () => void;
  isDerivativeShown: boolean;
}

/**
 * 문제 표시 컴포넌트
 */
export const ProblemDisplay: React.FC<ProblemDisplayProps> = ({
  problem,
  onDerivative,
  isDerivativeShown,
}) => {
  const difficultyColors = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800',
  };

  const difficultyLabels = {
    easy: '쉬움',
    medium: '보통',
    hard: '어려움',
  };

  return (
    <div className="p-6 bg-white">
      {/* 문제 헤더 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-900">{problem.title}</h2>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${difficultyColors[problem.difficulty]}`}>
            {difficultyLabels[problem.difficulty]}
          </span>
        </div>
        <p className="text-gray-600 text-sm">{problem.description}</p>
      </div>

      {/* 함수 표시 */}
      <div className="mb-4 p-4 bg-indigo-50 rounded-lg">
        <div className="text-center">
          <span className="text-2xl font-mono text-indigo-900">
            {problem.function.label}
          </span>
        </div>
      </div>

      {/* 미분 버튼 */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onDerivative}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all ${
          isDerivativeShown
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700'
        }`}
        disabled={isDerivativeShown}
      >
        {isDerivativeShown ? '미분 완료' : '미분하기 (Derivative Pulse)'}
      </motion.button>

      {/* 힌트 */}
      {problem.hints && problem.hints.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ delay: 0.3 }}
          className="mt-4"
        >
          <details className="group">
            <summary className="cursor-pointer text-sm font-semibold text-indigo-600 hover:text-indigo-800">
              💡 힌트 보기
            </summary>
            <ul className="mt-2 space-y-1 text-sm text-gray-600 list-disc list-inside">
              {problem.hints.map((hint, index) => (
                <li key={index}>{hint}</li>
              ))}
            </ul>
          </details>
        </motion.div>
      )}
    </div>
  );
};
