import React, { useState, useEffect } from 'react';
import { Problem } from '../types';
import './ProblemCard.css';

interface ProblemCardProps {
  problem: Problem;
  onSubmit: (answer: any) => void;
  isSubmitting?: boolean;
}

/**
 * Problem Card Component
 * Displays a quantifier problem and handles answer submission
 */
export const ProblemCard: React.FC<ProblemCardProps> = ({
  problem,
  onSubmit,
  isSubmitting = false,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    setSelectedAnswer(null);
  }, [problem.id]);

  const handleSubmit = () => {
    if (selectedAnswer !== null) {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      onSubmit({
        answer: selectedAnswer,
        timeSpent,
      });
    }
  };

  const handleOptionSelect = (option: any) => {
    setSelectedAnswer(option);
  };

  const isMultipleChoice = Array.isArray(problem.options) && problem.options.length > 0;

  return (
    <div className="problem-card">
      {/* Problem header */}
      <div className="problem-header">
        <h3 className="problem-title">{problem.title}</h3>
        <span className={`difficulty-badge ${problem.difficulty}`}>
          {problem.difficulty === 'easy' ? '쉬움' : problem.difficulty === 'medium' ? '보통' : '어려움'}
        </span>
      </div>

      {/* Problem description */}
      {problem.description && (
        <p className="problem-description">{problem.description}</p>
      )}

      {/* Problem statement */}
      <div className="problem-statement">
        <div className="statement-label">문제:</div>
        <div className="statement-text">{problem.statement}</div>
      </div>

      {/* Answer options */}
      <div className="answer-section">
        <div className="answer-label">답을 선택하세요:</div>

        {isMultipleChoice ? (
          <div className="options-list">
            {problem.options.map((option, index) => (
              <button
                key={index}
                className={`option-button ${selectedAnswer === option ? 'selected' : ''}`}
                onClick={() => handleOptionSelect(option)}
                disabled={isSubmitting}
              >
                <span className="option-number">{String.fromCharCode(65 + index)}</span>
                <span className="option-text">{typeof option === 'object' ? option.text : option}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="boolean-options">
            <button
              className={`boolean-button ${selectedAnswer === true ? 'selected' : ''}`}
              onClick={() => handleOptionSelect(true)}
              disabled={isSubmitting}
            >
              ⭕ 참 (True)
            </button>
            <button
              className={`boolean-button ${selectedAnswer === false ? 'selected' : ''}`}
              onClick={() => handleOptionSelect(false)}
              disabled={isSubmitting}
            >
              ❌ 거짓 (False)
            </button>
          </div>
        )}
      </div>

      {/* Submit button */}
      <button
        className="submit-button"
        onClick={handleSubmit}
        disabled={selectedAnswer === null || isSubmitting}
      >
        {isSubmitting ? '제출 중...' : '답안 제출'}
      </button>

      {/* Tags */}
      {problem.tags && problem.tags.length > 0 && (
        <div className="problem-tags">
          {problem.tags.map((tag, index) => (
            <span key={index} className="tag">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProblemCard;
