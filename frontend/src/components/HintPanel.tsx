/**
 * Hint Panel Component
 * Displays hints to students and allows requesting more hints
 */
import { useState } from 'react';
import type { HintResponse } from '../types';

interface HintPanelProps {
  hints: HintResponse[];
  currentLevel: number;
  maxLevel: number;
  onRequestHint: () => void;
  isLoading: boolean;
}

export function HintPanel({
  hints,
  currentLevel,
  maxLevel,
  onRequestHint,
  isLoading,
}: HintPanelProps) {
  const [expandedHints, setExpandedHints] = useState<Set<string>>(new Set());

  const toggleHint = (hintId: string) => {
    setExpandedHints((prev) => {
      const next = new Set(prev);
      if (next.has(hintId)) {
        next.delete(hintId);
      } else {
        next.add(hintId);
      }
      return next;
    });
  };

  const getHintTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      conceptual: '개념 힌트',
      strategic: '전략 힌트',
      procedural: '절차 힌트',
    };
    return labels[type] || '힌트';
  };

  const getHintTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      conceptual: 'bg-blue-100 text-blue-800',
      strategic: 'bg-green-100 text-green-800',
      procedural: 'bg-purple-100 text-purple-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">힌트</h2>
        <div className="text-sm text-gray-600">
          단계: {currentLevel} / {maxLevel}
        </div>
      </div>

      {hints.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">
            문제를 풀기 어려우신가요?
            <br />
            힌트를 요청하면 사고 방향을 안내해드립니다.
          </p>
          <p className="text-sm text-gray-400">
            힌트는 답을 직접 알려주지 않고, 스스로 생각할 수 있도록 도와줍니다.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {hints.map((hint, index) => (
            <div
              key={hint.hint_id}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleHint(hint.hint_id)}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-700">
                    힌트 {index + 1}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getHintTypeColor(
                      hint.hint_type
                    )}`}
                  >
                    {getHintTypeLabel(hint.hint_type)}
                  </span>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${
                    expandedHints.has(hint.hint_id) ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {expandedHints.has(hint.hint_id) && (
                <div className="px-4 py-4 bg-white">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {hint.hint_text}
                  </p>
                  <div className="mt-3 text-xs text-gray-400">
                    단계 {hint.hint_level}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="pt-4 border-t border-gray-200">
        {currentLevel < maxLevel ? (
          <button
            onClick={onRequestHint}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                힌트 생성 중...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                다음 힌트 받기
              </>
            )}
          </button>
        ) : (
          <div className="text-center py-2 text-gray-500">
            모든 힌트를 받았습니다. 이제 스스로 풀어보세요!
          </div>
        )}

        {hints.length > 0 && (
          <p className="mt-3 text-xs text-gray-500 text-center">
            힌트는 점진적으로 제공됩니다. 각 단계마다 조금씩 더 구체적인 안내를
            받을 수 있습니다.
          </p>
        )}
      </div>
    </div>
  );
}
