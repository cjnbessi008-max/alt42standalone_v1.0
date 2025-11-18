import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  score: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, score }) => {
  const progress = (current / total) * 100;
  const accuracy = current > 0 ? (score / current) * 100 : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-4">
          <span className="text-lg font-semibold text-gray-700">
            문제 {current + 1} / {total}
          </span>
          <span className="text-sm text-gray-500">
            정답률: {accuracy.toFixed(0)}%
          </span>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-primary-600">
            {score}점
          </span>
          <span className="text-gray-500 ml-1">/ {total}점</span>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>진행률: {progress.toFixed(0)}%</span>
        <span>{total - current - 1}문제 남음</span>
      </div>
    </div>
  );
};
