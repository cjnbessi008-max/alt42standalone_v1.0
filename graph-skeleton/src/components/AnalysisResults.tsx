import React from 'react';
import { GraphAnalysis } from '../utils/types';

interface AnalysisResultsProps {
  analysis: GraphAnalysis | null;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ analysis }) => {
  if (!analysis) {
    return null;
  }

  const formatNumber = (num: number): string => {
    return num.toFixed(3);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 animate-fade-in-up">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">분석 결과</h2>

      {/* Increasing/Decreasing Intervals */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-700 flex items-center gap-2">
          <span className="text-2xl">📈</span>
          증가/감소 구간
        </h3>
        <div className="space-y-2">
          {analysis.intervals.length > 0 ? (
            analysis.intervals.map((interval, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  interval.type === 'increasing'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <span
                  className={`font-semibold ${
                    interval.type === 'increasing' ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {interval.type === 'increasing' ? '증가 ↗' : '감소 ↘'}
                </span>
                <span className="text-gray-700 ml-2">
                  [{formatNumber(interval.start)}, {formatNumber(interval.end)}]
                </span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic">구간 정보 없음</p>
          )}
        </div>
      </div>

      {/* Critical Points */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-700 flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          극값 (Critical Points)
        </h3>
        <div className="space-y-2">
          {analysis.criticalPoints.length > 0 ? (
            analysis.criticalPoints.map((point, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  point.type === 'maximum'
                    ? 'bg-red-50 border border-red-200'
                    : point.type === 'minimum'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-semibold ${
                      point.type === 'maximum'
                        ? 'text-red-700'
                        : point.type === 'minimum'
                        ? 'text-green-700'
                        : 'text-gray-700'
                    }`}
                  >
                    {point.type === 'maximum' ? '극대 📍' : point.type === 'minimum' ? '극소 📍' : '안장점'}
                  </span>
                  <span className="text-sm text-gray-600">
                    ({formatNumber(point.x)}, {formatNumber(point.y)})
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  f({formatNumber(point.x)}) = {formatNumber(point.value)}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic">극값이 없습니다</p>
          )}
        </div>
      </div>

      {/* Inflection Points */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-700 flex items-center gap-2">
          <span className="text-2xl">🔄</span>
          변곡점 (Inflection Points)
        </h3>
        <div className="space-y-2">
          {analysis.inflectionPoints.length > 0 ? (
            analysis.inflectionPoints.map((point, index) => (
              <div key={index} className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-yellow-700">변곡점 🔶</span>
                  <span className="text-sm text-gray-600">
                    ({formatNumber(point.x)}, {formatNumber(point.y)})
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  f({formatNumber(point.x)}) = {formatNumber(point.value)}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic">변곡점이 없습니다</p>
          )}
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
        <h3 className="text-lg font-semibold mb-2 text-gray-700">요약</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-600">정의역:</span>
            <span className="font-semibold ml-2">
              [{formatNumber(analysis.domain.min)}, {formatNumber(analysis.domain.max)}]
            </span>
          </div>
          <div>
            <span className="text-gray-600">극값 개수:</span>
            <span className="font-semibold ml-2">{analysis.criticalPoints.length}개</span>
          </div>
          <div>
            <span className="text-gray-600">변곡점 개수:</span>
            <span className="font-semibold ml-2">{analysis.inflectionPoints.length}개</span>
          </div>
          <div>
            <span className="text-gray-600">구간 개수:</span>
            <span className="font-semibold ml-2">{analysis.intervals.length}개</span>
          </div>
        </div>
      </div>
    </div>
  );
};
