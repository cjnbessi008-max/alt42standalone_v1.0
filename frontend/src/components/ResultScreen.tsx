import React from 'react';
import { SubmitAnswerResponse, Character } from '../types';
import './ResultScreen.css';

interface ResultScreenProps {
  result: SubmitAnswerResponse;
  character: Character;
  onNextProblem: () => void;
}

/**
 * Result Screen Component
 * Shows feedback and explanation after answer submission
 */
export const ResultScreen: React.FC<ResultScreenProps> = ({
  result,
  character,
  onNextProblem,
}) => {
  const { submission, feedback, explanation } = result;
  const isCorrect = submission.isCorrect;

  return (
    <div className={`result-screen ${isCorrect ? 'correct' : 'incorrect'}`}>
      {/* Result icon */}
      <div className="result-icon">
        {isCorrect ? '🎉' : '💭'}
      </div>

      {/* Result message */}
      <h2 className="result-title">
        {isCorrect ? '정답입니다!' : '아쉽지만 틀렸어요'}
      </h2>

      {/* Score */}
      <div className="score-display">
        <div className="score-circle" style={{ borderColor: character.color }}>
          <span className="score-number">{submission.score}</span>
          <span className="score-label">점</span>
        </div>
      </div>

      {/* Feedback */}
      <div className="feedback-box">
        <p className="feedback-text">{feedback}</p>
      </div>

      {/* Explanation (only shown if correct) */}
      {isCorrect && explanation && (
        <div className="explanation-box">
          <div className="explanation-label">📚 설명</div>
          <p className="explanation-text">{explanation}</p>
        </div>
      )}

      {/* Stats */}
      <div className="submission-stats">
        <div className="stat-item">
          <span className="stat-icon">⏱️</span>
          <span className="stat-value">{submission.timeSpent}초</span>
          <span className="stat-label">소요 시간</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">💡</span>
          <span className="stat-value">{submission.hintsUsed}개</span>
          <span className="stat-label">힌트 사용</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">🔄</span>
          <span className="stat-value">{submission.attempts}번</span>
          <span className="stat-label">시도 횟수</span>
        </div>
      </div>

      {/* Next problem button */}
      <button
        className="next-button"
        onClick={onNextProblem}
        style={{ background: `linear-gradient(135deg, ${character.color}dd, ${character.color}ff)` }}
      >
        다음 문제 도전하기 →
      </button>
    </div>
  );
};

export default ResultScreen;
