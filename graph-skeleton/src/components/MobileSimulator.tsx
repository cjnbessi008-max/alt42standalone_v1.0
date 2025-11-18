import React from 'react';
import { GraphAnalysis } from '../utils/types';

interface MobileSimulatorProps {
  analysis: GraphAnalysis | null;
}

export const MobileSimulator: React.FC<MobileSimulatorProps> = ({ analysis }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Phone Frame */}
      <div className="relative w-80 h-[600px] bg-black rounded-[40px] shadow-2xl p-3 animate-fade-in-up">
        {/* Phone Notch */}
        <div className="phone-notch">
          <div className="phone-speaker"></div>
        </div>

        {/* Screen */}
        <div className="bg-white h-full rounded-[30px] overflow-hidden relative">
          {/* Status Bar */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 flex justify-between items-center text-xs">
            <span>9:41</span>
            <span className="font-semibold">Graph Skeleton</span>
            <div className="flex gap-1">
              <span>📶</span>
              <span>🔋</span>
            </div>
          </div>

          {/* Content Area */}
          <div className="h-[calc(100%-32px)] overflow-y-auto p-3 bg-gradient-to-br from-blue-50 to-purple-50">
            {analysis ? (
              <div className="space-y-3">
                {/* Mini Graph */}
                <div className="bg-white rounded-lg shadow-md p-3">
                  <h3 className="text-sm font-bold mb-2 text-gray-800">그래프</h3>
                  <div className="h-32 flex items-center justify-center bg-gray-50 rounded">
                    <div className="text-xs text-gray-500 text-center">
                      <div className="mb-1">📊</div>
                      <div>메인 화면에서</div>
                      <div>자세히 보기</div>
                    </div>
                  </div>
                </div>

                {/* Mini Results */}
                <div className="bg-white rounded-lg shadow-md p-3">
                  <h3 className="text-sm font-bold mb-2 text-gray-800">분석 결과</h3>

                  {/* Critical Points */}
                  <div className="mb-2">
                    <div className="text-xs font-semibold text-gray-600 mb-1">극값</div>
                    {analysis.criticalPoints.length > 0 ? (
                      <div className="space-y-1">
                        {analysis.criticalPoints.slice(0, 3).map((point, idx) => (
                          <div
                            key={idx}
                            className={`text-xs p-2 rounded ${
                              point.type === 'maximum' ? 'bg-red-50' : 'bg-green-50'
                            }`}
                          >
                            <span className={point.type === 'maximum' ? 'text-red-600' : 'text-green-600'}>
                              {point.type === 'maximum' ? '극대' : '극소'}
                            </span>
                            {' '}
                            ({point.x.toFixed(2)}, {point.y.toFixed(2)})
                          </div>
                        ))}
                        {analysis.criticalPoints.length > 3 && (
                          <div className="text-xs text-gray-400 italic">
                            +{analysis.criticalPoints.length - 3}개 더...
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 italic">없음</div>
                    )}
                  </div>

                  {/* Inflection Points */}
                  <div className="mb-2">
                    <div className="text-xs font-semibold text-gray-600 mb-1">변곡점</div>
                    {analysis.inflectionPoints.length > 0 ? (
                      <div className="space-y-1">
                        {analysis.inflectionPoints.slice(0, 3).map((point, idx) => (
                          <div key={idx} className="text-xs p-2 rounded bg-yellow-50">
                            <span className="text-yellow-600">변곡</span>
                            {' '}
                            ({point.x.toFixed(2)}, {point.y.toFixed(2)})
                          </div>
                        ))}
                        {analysis.inflectionPoints.length > 3 && (
                          <div className="text-xs text-gray-400 italic">
                            +{analysis.inflectionPoints.length - 3}개 더...
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 italic">없음</div>
                    )}
                  </div>

                  {/* Intervals */}
                  <div>
                    <div className="text-xs font-semibold text-gray-600 mb-1">증가/감소</div>
                    {analysis.intervals.length > 0 ? (
                      <div className="space-y-1">
                        {analysis.intervals.slice(0, 2).map((interval, idx) => (
                          <div
                            key={idx}
                            className={`text-xs p-2 rounded ${
                              interval.type === 'increasing' ? 'bg-green-50' : 'bg-red-50'
                            }`}
                          >
                            <span className={interval.type === 'increasing' ? 'text-green-600' : 'text-red-600'}>
                              {interval.type === 'increasing' ? '증가 ↗' : '감소 ↘'}
                            </span>
                            {' '}
                            [{interval.start.toFixed(1)}, {interval.end.toFixed(1)}]
                          </div>
                        ))}
                        {analysis.intervals.length > 2 && (
                          <div className="text-xs text-gray-400 italic">
                            +{analysis.intervals.length - 2}개 더...
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 italic">없음</div>
                    )}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-md p-3">
                  <div className="text-xs font-semibold mb-2">요약</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>극값: {analysis.criticalPoints.length}개</div>
                    <div>변곡: {analysis.inflectionPoints.length}개</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <div className="text-4xl mb-2">📱</div>
                  <div className="text-sm">함수를 입력하고</div>
                  <div className="text-sm">분석을 시작하세요</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Home Button */}
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-700 rounded-full"></div>
      </div>

      {/* Label */}
      <div className="absolute -top-8 left-0 bg-white px-3 py-1 rounded-full shadow-md text-xs font-semibold text-gray-700">
        가상 스마트폰 📱
      </div>
    </div>
  );
};
