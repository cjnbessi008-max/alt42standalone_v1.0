import React from 'react';
import { LogicSummaryResponse } from '../types';

interface VirtualPhoneProps {
  summary: LogicSummaryResponse | null;
}

export const VirtualPhone: React.FC<VirtualPhoneProps> = ({ summary }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Phone Frame */}
      <div className="relative w-80 h-[600px] bg-gray-900 rounded-[3rem] shadow-2xl border-8 border-gray-800">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-7 bg-gray-900 rounded-b-3xl z-10"></div>

        {/* Screen */}
        <div className="absolute inset-3 bg-white rounded-[2.5rem] overflow-hidden">
          {/* Status Bar */}
          <div className="bg-primary-600 text-white px-4 py-2 flex justify-between items-center text-xs">
            <span>9:41</span>
            <span className="font-semibold">Logic Summary App</span>
            <div className="flex gap-1">
              <span>📶</span>
              <span>🔋</span>
            </div>
          </div>

          {/* App Content */}
          <div className="p-4 h-[calc(100%-2rem)] overflow-y-auto bg-gradient-to-b from-blue-50 to-white">
            {!summary ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                <div className="text-6xl mb-4">🧠</div>
                <p className="text-sm font-semibold">Logic Summary</p>
                <p className="text-xs mt-2 px-4">
                  문제를 분석하면<br />여기에 결과가 표시됩니다
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Mobile Summary Card */}
                <div className="bg-white rounded-lg shadow-md p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">📝</span>
                    <h3 className="font-bold text-sm text-gray-800">요약</h3>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {summary.logic_summary}
                  </p>
                </div>

                {/* Mobile Propositions */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🔍</span>
                    <h3 className="font-bold text-sm text-gray-800">
                      명제 ({summary.propositions.length})
                    </h3>
                  </div>

                  {summary.propositions.map((prop) => (
                    <div
                      key={prop.id}
                      className="bg-white rounded-lg shadow-sm p-2 border-l-4 border-primary-500"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono font-bold text-primary-600">
                          {prop.id}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                          {prop.type}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 leading-snug">{prop.text}</p>
                      <div className="mt-1">
                        <div className="flex items-center gap-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-primary-500 h-full rounded-full"
                              style={{ width: `${prop.confidence * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {Math.round(prop.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Relationships on Mobile */}
                {summary.visualization_data?.edges && summary.visualization_data.edges.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-3 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🔗</span>
                      <h3 className="font-bold text-sm text-gray-800">관계</h3>
                    </div>
                    <div className="space-y-1">
                      {summary.visualization_data.edges.map((edge, idx) => (
                        <div key={idx} className="text-xs flex items-center gap-1 text-gray-700">
                          <span className="font-mono text-primary-600 font-semibold">
                            {edge.from}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="font-mono text-primary-600 font-semibold">
                            {edge.to}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Home Indicator */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-300 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
