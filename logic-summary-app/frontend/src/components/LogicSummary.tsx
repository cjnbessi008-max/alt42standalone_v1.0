import React from 'react';
import { LogicSummaryResponse } from '../types';

interface LogicSummaryProps {
  summary: LogicSummaryResponse | null;
}

export const LogicSummary: React.FC<LogicSummaryProps> = ({ summary }) => {
  if (!summary) {
    return (
      <div className="bg-gray-50 rounded-lg shadow-md p-6 text-center text-gray-500">
        문제를 입력하고 분석하면 여기에 논리 요약이 표시됩니다.
        <br />
        Enter a problem and analyze it to see the logic summary here.
      </div>
    );
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'premise':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'assumption':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'conclusion':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'constraint':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'operation':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'premise':
        return '전제 / Premise';
      case 'assumption':
        return '가정 / Assumption';
      case 'conclusion':
        return '결론 / Conclusion';
      case 'constraint':
        return '제약 / Constraint';
      case 'operation':
        return '연산 / Operation';
      default:
        return type;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 border-b pb-3">
        논리 요약 / Logic Summary
      </h2>

      {/* Summary Text */}
      <div className="bg-blue-50 border-l-4 border-primary-600 p-4 rounded">
        <h3 className="font-semibold text-gray-800 mb-2">📝 전체 요약 / Overall Summary</h3>
        <p className="text-gray-700 leading-relaxed">{summary.logic_summary}</p>
      </div>

      {/* Propositions */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3">
          🔍 추출된 명제 / Extracted Propositions ({summary.propositions.length})
        </h3>
        <div className="space-y-3">
          {summary.propositions.map((prop) => (
            <div
              key={prop.id}
              className={`border-2 rounded-lg p-4 ${getTypeColor(prop.type)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="font-mono text-xs font-bold">{prop.id}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-white bg-opacity-50">
                    {getTypeName(prop.type)}
                  </span>
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-white bg-opacity-50">
                    {Math.round(prop.confidence * 100)}% 신뢰도
                  </span>
                </div>
              </div>
              <p className="text-sm leading-relaxed">{prop.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Visualization Data (if available) */}
      {summary.visualization_data && summary.visualization_data.nodes && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">
            🔗 논리 관계 / Logic Relationships
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-2">
              {summary.visualization_data.edges?.map((edge, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <span className="font-mono font-semibold text-primary-600">
                    {edge.from}
                  </span>
                  <span className="text-gray-500">
                    {edge.relationship === 'implies' && '→ 함의 / implies'}
                    {edge.relationship === 'supports' && '⊢ 지지 / supports'}
                    {edge.relationship === 'contradicts' && '⊥ 모순 / contradicts'}
                  </span>
                  <span className="font-mono font-semibold text-primary-600">
                    {edge.to}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
