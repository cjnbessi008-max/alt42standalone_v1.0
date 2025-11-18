/**
 * ThinkingStyleProfile Component
 * Displays complete thinking style profile with all three scores
 */
import React from 'react';
import { ThinkingStyleBadge, ThinkingStyleType } from './ThinkingStyleBadge';

interface ThinkingStyleScores {
  computational: number;
  intuitive: number;
  visual: number;
}

interface ThinkingStyleProfileProps {
  studentId: string;
  primaryStyle: ThinkingStyleType;
  secondaryStyle?: ThinkingStyleType;
  isHybrid?: boolean;
  scores: ThinkingStyleScores;
  confidenceLevel: 'low' | 'medium' | 'high';
  dataPointsCount: number;
  lastAssessed: Date;
  recommendations?: string[];
}

const confidenceLabelMap = {
  low: { label: '낮음', color: '#EF4444' },
  medium: { label: '보통', color: '#F59E0B' },
  high: { label: '높음', color: '#10B981' },
};

export const ThinkingStyleProfile: React.FC<ThinkingStyleProfileProps> = ({
  studentId,
  primaryStyle,
  secondaryStyle,
  isHybrid = false,
  scores,
  confidenceLevel,
  dataPointsCount,
  lastAssessed,
  recommendations = [],
}) => {
  const confidenceInfo = confidenceLabelMap[confidenceLevel];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">사고 스타일 프로필</h2>
        <p className="text-sm text-gray-500">
          마지막 평가: {lastAssessed.toLocaleDateString('ko-KR')} | 데이터 포인트: {dataPointsCount}개
        </p>
      </div>

      {/* Primary Style Badge */}
      <div>
        <h3 className="text-sm font-semibold text-gray-600 mb-3">주요 사고 스타일</h3>
        <ThinkingStyleBadge
          primaryStyle={primaryStyle}
          score={scores[primaryStyle]}
          variant="detailed"
        />
        {isHybrid && secondaryStyle && secondaryStyle !== 'none' && (
          <div className="mt-3">
            <p className="text-sm text-gray-600 mb-2">보조 스타일 (하이브리드)</p>
            <ThinkingStyleBadge
              primaryStyle={secondaryStyle}
              score={scores[secondaryStyle]}
              variant="compact"
            />
          </div>
        )}
      </div>

      {/* All Scores */}
      <div>
        <h3 className="text-sm font-semibold text-gray-600 mb-3">전체 스타일 점수</h3>
        <div className="space-y-3">
          <ScoreBar label="계산형" score={scores.computational} color="#3B82F6" />
          <ScoreBar label="직관형" score={scores.intuitive} color="#10B981" />
          <ScoreBar label="그림형" score={scores.visual} color="#F59E0B" />
        </div>
      </div>

      {/* Confidence Level */}
      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
        <span className="text-sm font-semibold text-gray-600">분류 신뢰도:</span>
        <span
          className="px-3 py-1 rounded-full text-sm font-semibold"
          style={{ backgroundColor: `${confidenceInfo.color}20`, color: confidenceInfo.color }}
        >
          {confidenceInfo.label}
        </span>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-3">맞춤 학습 추천</h3>
          <ul className="space-y-2">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span className="text-sm text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Helper component for score bars
const ScoreBar: React.FC<{ label: string; score: number; color: string }> = ({
  label,
  score,
  color,
}) => (
  <div>
    <div className="flex justify-between text-sm mb-1">
      <span className="text-gray-700">{label}</span>
      <span className="font-semibold" style={{ color }}>
        {Math.round(score)}%
      </span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className="h-2.5 rounded-full transition-all duration-500"
        style={{ width: `${score}%`, backgroundColor: color }}
      />
    </div>
  </div>
);

export default ThinkingStyleProfile;
