/**
 * Easy Problems Interface
 *
 * Student interface for confidence-building easy problems
 * Features:
 * - Display student's confidence level
 * - Show appropriate easy problems
 * - Interactive problem solving
 * - Real-time confidence updates
 */

import React, { useState, useEffect } from 'react';
import './EasyProblemsInterface.css';

// ============================================
// Types
// ============================================

interface ConfidenceData {
  student_id: string;
  module_id: string;
  current_score: number;
  confidence_level: string;
  consecutive_correct: number;
  mastery_count: number;
  recommended_difficulty: number;
  last_updated: string;
}

interface ProblemData {
  problem_id: string;
  problem_type: string;
  difficulty_level: number;
  problem_text: string;
  hint_text?: string;
  visual_representation?: string;
  numerator_1?: number;
  denominator_1?: number;
  numerator_2?: number;
  denominator_2?: number;
  operation?: string;
}

interface EasyProblem {
  problem_id: string;
  module_id: string;
  difficulty_level: number;
  confidence_boost: number;
  success_rate?: number;
  problem_data: ProblemData;
}

interface SubmitAnswerResponse {
  is_correct: boolean;
  confidence_before: number;
  confidence_after: number;
  confidence_delta: number;
  correct_answer: {
    numerator: number;
    denominator: number;
  };
  explanation: string;
  encouragement: string;
}

// ============================================
// Props
// ============================================

interface EasyProblemsInterfaceProps {
  studentId: string;
  moduleId: string;
  apiBaseUrl?: string;
}

// ============================================
// Main Component
// ============================================

const EasyProblemsInterface: React.FC<EasyProblemsInterfaceProps> = ({
  studentId,
  moduleId,
  apiBaseUrl = 'http://localhost:8000'
}) => {
  // State
  const [confidence, setConfidence] = useState<ConfidenceData | null>(null);
  const [currentProblem, setCurrentProblem] = useState<EasyProblem | null>(null);
  const [answerNumerator, setAnswerNumerator] = useState<string>('');
  const [answerDenominator, setAnswerDenominator] = useState<string>('');
  const [showHint, setShowHint] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [feedback, setFeedback] = useState<SubmitAnswerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // API Calls
  // ============================================

  const fetchConfidence = async () => {
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/confidence/${studentId}/${moduleId}`
      );
      if (!response.ok) throw new Error('Failed to fetch confidence');
      const data = await response.json();
      setConfidence(data);
    } catch (err) {
      setError('자신감 점수를 불러올 수 없습니다.');
      console.error(err);
    }
  };

  const fetchNextProblem = async () => {
    try {
      setLoading(true);
      setFeedback(null);
      setShowHint(false);
      setAnswerNumerator('');
      setAnswerDenominator('');

      const response = await fetch(
        `${apiBaseUrl}/api/easy-problems/${studentId}/${moduleId}/next`
      );

      if (!response.ok) throw new Error('Failed to fetch problem');

      const data = await response.json();
      setCurrentProblem(data);
      setStartTime(Date.now());
    } catch (err) {
      setError('문제를 불러올 수 없습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!currentProblem || !answerNumerator || !answerDenominator) {
      setError('답을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      const response = await fetch(`${apiBaseUrl}/api/submit-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId,
          module_id: moduleId,
          problem_id: currentProblem.problem_id,
          answer_numerator: parseInt(answerNumerator),
          answer_denominator: parseInt(answerDenominator),
          time_spent_seconds: timeSpent,
          hint_used: showHint
        })
      });

      if (!response.ok) throw new Error('Failed to submit answer');

      const data = await response.json();
      setFeedback(data);

      // Update confidence
      await fetchConfidence();
    } catch (err) {
      setError('답을 제출할 수 없습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // Effects
  // ============================================

  useEffect(() => {
    fetchConfidence();
    fetchNextProblem();
  }, [studentId, moduleId]);

  // ============================================
  // Render Helpers
  // ============================================

  const getConfidenceColor = (score: number): string => {
    if (score < 30) return '#ff4444';
    if (score < 50) return '#ff8800';
    if (score < 70) return '#ffaa00';
    if (score < 85) return '#88cc00';
    return '#44cc44';
  };

  const getDifficultyLabel = (level: number): string => {
    switch (level) {
      case 1: return '매우 쉬움';
      case 2: return '쉬움';
      case 3: return '보통';
      default: return '쉬움';
    }
  };

  const renderFractionVisual = (problem: ProblemData) => {
    if (problem.problem_type !== 'visualization') return null;

    const total = problem.denominator_1 || 4;
    const filled = problem.numerator_1 || 1;

    return (
      <div className="fraction-visual">
        {problem.visual_representation === 'pizza' && (
          <div className="pizza-visual">
            {Array.from({ length: total }).map((_, i) => (
              <div
                key={i}
                className={`pizza-slice ${i < filled ? 'filled' : ''}`}
              />
            ))}
          </div>
        )}
        {problem.visual_representation === 'circle' && (
          <div className="circle-visual">
            {Array.from({ length: total }).map((_, i) => (
              <div
                key={i}
                className={`circle-segment ${i < filled ? 'filled' : ''}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // ============================================
  // Render
  // ============================================

  if (error) {
    return (
      <div className="easy-problems-interface error">
        <p>오류: {error}</p>
        <button onClick={() => window.location.reload()}>다시 시도</button>
      </div>
    );
  }

  return (
    <div className="easy-problems-interface">
      {/* Header with Confidence */}
      <div className="confidence-header">
        <h1>자신감 회복 연습</h1>
        {confidence && (
          <div className="confidence-display">
            <div className="confidence-label">현재 자신감</div>
            <div
              className="confidence-bar-container"
              style={{ backgroundColor: '#f0f0f0' }}
            >
              <div
                className="confidence-bar"
                style={{
                  width: `${confidence.current_score}%`,
                  backgroundColor: getConfidenceColor(confidence.current_score)
                }}
              />
            </div>
            <div className="confidence-score">
              {confidence.current_score.toFixed(0)}점
            </div>
            <div className="confidence-level">
              {confidence.confidence_level}
            </div>
            {confidence.consecutive_correct > 0 && (
              <div className="streak">
                🔥 연속 {confidence.consecutive_correct}개 정답!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Problem Display */}
      {currentProblem && !feedback && (
        <div className="problem-container">
          <div className="problem-header">
            <span className="difficulty-badge">
              난이도: {getDifficultyLabel(currentProblem.difficulty_level)}
            </span>
            {currentProblem.success_rate && (
              <span className="success-rate">
                성공률: {(currentProblem.success_rate * 100).toFixed(0)}%
              </span>
            )}
          </div>

          <div className="problem-content">
            {renderFractionVisual(currentProblem.problem_data)}

            <div className="problem-text">
              <h2>{currentProblem.problem_data.problem_text}</h2>
            </div>

            {showHint && currentProblem.problem_data.hint_text && (
              <div className="hint-box">
                💡 힌트: {currentProblem.problem_data.hint_text}
              </div>
            )}
          </div>

          {/* Answer Input */}
          <div className="answer-input">
            <h3>답을 입력하세요:</h3>
            <div className="fraction-input">
              <input
                type="number"
                value={answerNumerator}
                onChange={(e) => setAnswerNumerator(e.target.value)}
                placeholder="분자"
                className="numerator-input"
              />
              <div className="fraction-line">/</div>
              <input
                type="number"
                value={answerDenominator}
                onChange={(e) => setAnswerDenominator(e.target.value)}
                placeholder="분모"
                className="denominator-input"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            {!showHint && currentProblem.problem_data.hint_text && (
              <button
                className="hint-button"
                onClick={() => setShowHint(true)}
              >
                💡 힌트 보기
              </button>
            )}
            <button
              className="submit-button"
              onClick={submitAnswer}
              disabled={loading || !answerNumerator || !answerDenominator}
            >
              {loading ? '제출 중...' : '답 제출'}
            </button>
          </div>
        </div>
      )}

      {/* Feedback Display */}
      {feedback && (
        <div className={`feedback-container ${feedback.is_correct ? 'correct' : 'incorrect'}`}>
          <div className="feedback-header">
            <h2>{feedback.is_correct ? '정답입니다! 🎉' : '아쉽지만 틀렸어요 😊'}</h2>
          </div>

          <div className="feedback-content">
            {!feedback.is_correct && (
              <div className="correct-answer">
                정답: {feedback.correct_answer.numerator}/{feedback.correct_answer.denominator}
              </div>
            )}

            <div className="explanation">
              <strong>설명:</strong> {feedback.explanation}
            </div>

            <div className="encouragement">
              {feedback.encouragement}
            </div>

            <div className="confidence-change">
              <div className="change-label">자신감 변화:</div>
              <div className="change-value">
                {feedback.confidence_before.toFixed(0)}점 → {feedback.confidence_after.toFixed(0)}점
                <span className={`delta ${feedback.confidence_delta >= 0 ? 'positive' : 'negative'}`}>
                  ({feedback.confidence_delta >= 0 ? '+' : ''}{feedback.confidence_delta.toFixed(1)})
                </span>
              </div>
            </div>
          </div>

          <div className="feedback-actions">
            <button
              className="next-button"
              onClick={fetchNextProblem}
            >
              다음 문제 풀기 →
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !currentProblem && (
        <div className="loading">
          <div className="spinner"></div>
          <p>문제를 불러오는 중...</p>
        </div>
      )}
    </div>
  );
};

export default EasyProblemsInterface;
