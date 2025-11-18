/**
 * TipDisplay Component - 관점 전환 팁 표시
 */
import React, { useState } from 'react';
import type { PerspectiveTip, TipResponse } from '../types';
import { api } from '../services/api';

interface TipDisplayProps {
  tipResponse: TipResponse;
  onFeedback?: (wasHelpful: boolean, feedback?: string) => void;
  language?: 'ko' | 'en';
}

const TipDisplay: React.FC<TipDisplayProps> = ({
  tipResponse,
  onFeedback,
  language = 'ko',
}) => {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  const { tip, recommendation_id, confidence_score, personalized, alternative_tips } = tipResponse;

  // 관점 타입 아이콘 매핑
  const perspectiveIcons: Record<string, string> = {
    visual: '👁️',
    algebraic: '🔢',
    geometric: '📐',
    conceptual: '💡',
  };

  // 팁 레벨 표시
  const getLevelBadge = (level: number) => {
    const levels = ['기초', '중급', '고급'];
    const colors = ['bg-green-100 text-green-800', 'bg-blue-100 text-blue-800', 'bg-purple-100 text-purple-800'];
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded ${colors[level - 1]}`}>
        {levels[level - 1]}
      </span>
    );
  };

  // 피드백 제출
  const handleFeedback = async (wasHelpful: boolean) => {
    try {
      await api.submitTipFeedback(recommendation_id, wasHelpful, feedbackText);
      setFeedbackSubmitted(true);
      if (onFeedback) {
        onFeedback(wasHelpful, feedbackText);
      }
    } catch (error) {
      console.error('피드백 제출 실패:', error);
    }
  };

  const title = language === 'ko' ? tip.title_ko : tip.title;
  const content = language === 'ko' ? tip.content_ko : tip.content;

  return (
    <div className="tip-display bg-white rounded-lg shadow-md p-6 mb-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{perspectiveIcons[tip.perspective_type]}</span>
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {getLevelBadge(tip.tip_level)}
          {personalized && (
            <span className="px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">
              맞춤 추천
            </span>
          )}
        </div>
      </div>

      {/* 신뢰도 표시 */}
      {confidence_score > 0.7 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>추천 신뢰도:</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${confidence_score * 100}%` }}
              />
            </div>
            <span className="font-semibold">{Math.round(confidence_score * 100)}%</span>
          </div>
        </div>
      )}

      {/* 팁 내용 */}
      <div className="tip-content bg-blue-50 rounded-lg p-4 mb-4">
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>

      {/* 예제 문제 (있는 경우) */}
      {tip.example_problem && (
        <div className="example-problem bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-gray-800 mb-2">📝 예제 문제</h4>
          <div className="text-gray-700">
            {JSON.stringify(tip.example_problem, null, 2)}
          </div>
        </div>
      )}

      {/* 피드백 섹션 */}
      {!feedbackSubmitted ? (
        <div className="feedback-section border-t pt-4">
          <p className="text-sm text-gray-600 mb-3">이 팁이 도움이 되었나요?</p>
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => handleFeedback(true)}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded transition"
            >
              👍 도움됨
            </button>
            <button
              onClick={() => handleFeedback(false)}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded transition"
            >
              👎 도움 안됨
            </button>
          </div>
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="추가 의견을 남겨주세요 (선택사항)"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            rows={2}
          />
        </div>
      ) : (
        <div className="feedback-submitted bg-green-50 border border-green-200 rounded p-3 text-center text-green-700">
          ✓ 피드백이 제출되었습니다. 감사합니다!
        </div>
      )}

      {/* 대안 팁 */}
      {alternative_tips.length > 0 && (
        <div className="alternative-tips mt-4">
          <button
            onClick={() => setShowAlternatives(!showAlternatives)}
            className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
          >
            {showAlternatives ? '▼' : '▶'} 다른 관점의 팁 보기 ({alternative_tips.length}개)
          </button>

          {showAlternatives && (
            <div className="mt-3 space-y-2">
              {alternative_tips.map((altTip, index) => (
                <div
                  key={altTip.id}
                  className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span>{perspectiveIcons[altTip.perspective_type]}</span>
                    <span className="font-semibold text-sm">
                      {language === 'ko' ? altTip.title_ko : altTip.title}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {language === 'ko' ? altTip.content_ko : altTip.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TipDisplay;
