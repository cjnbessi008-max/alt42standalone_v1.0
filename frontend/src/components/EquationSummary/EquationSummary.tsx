import React from 'react';
import { EquationSummary as SummaryType } from '../../types';

interface Props {
  summary: SummaryType;
  isLoading?: boolean;
}

export const EquationSummary: React.FC<Props> = ({ summary, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 shadow-md">
        <h3 className="text-sm font-semibold text-indigo-700 mb-3 flex items-center">
          <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full mr-2 animate-pulse"></span>
          AI 요약 생성 중...
        </h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-indigo-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const confidenceColor =
    summary.confidence >= 0.8
      ? 'text-green-600'
      : summary.confidence >= 0.6
      ? 'text-yellow-600'
      : 'text-red-600';

  const confidenceLabel =
    summary.confidence >= 0.8
      ? '높음'
      : summary.confidence >= 0.6
      ? '보통'
      : '낮음';

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 shadow-md border border-indigo-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-indigo-700 flex items-center">
          <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
          AI 문제 구조 요약
        </h3>
        <span className={`text-xs font-medium ${confidenceColor}`}>
          신뢰도: {confidenceLabel} ({(summary.confidence * 100).toFixed(0)}%)
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-start">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold mr-2 flex-shrink-0">
            1
          </span>
          <p className="text-sm text-gray-700 leading-relaxed">{summary.line1}</p>
        </div>

        <div className="flex items-start">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold mr-2 flex-shrink-0">
            2
          </span>
          <p className="text-sm text-gray-700 leading-relaxed">{summary.line2}</p>
        </div>

        <div className="flex items-start">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold mr-2 flex-shrink-0">
            3
          </span>
          <p className="text-sm text-gray-700 leading-relaxed">{summary.line3}</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-indigo-200">
        <p className="text-xs text-gray-500">
          처리 시간: {(summary.processingTime / 1000).toFixed(2)}초
        </p>
      </div>
    </div>
  );
};
