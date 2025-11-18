/**
 * Problem Display Component
 * 문제를 표시하고 답안을 받는 컴포넌트
 */

import React, { useState } from 'react';
import { Problem } from '../types';
import '../styles/ProblemDisplay.css';

interface ProblemDisplayProps {
  problem: Problem;
  onSubmit: (answer: string) => void;
}

const ProblemDisplay: React.FC<ProblemDisplayProps> = ({ problem, onSubmit }) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userAnswer.trim()) {
      alert('답을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(userAnswer);
      setUserAnswer('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="problem-display">
      <div className="problem-header">
        <h3>문제</h3>
        <span className="problem-points">{problem.points}점</span>
      </div>

      <div className="problem-content">
        <p className="question-text">{problem.question_text}</p>

        {problem.artwork_svg && (
          <div className="problem-artwork">
            <div dangerouslySetInnerHTML={{ __html: problem.artwork_svg }} />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="answer-form">
        <div className="form-group">
          <label htmlFor="answer">답:</label>
          <input
            id="answer"
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="답을 입력하세요"
            disabled={isSubmitting}
            autoComplete="off"
          />
        </div>

        <button
          type="submit"
          className="submit-button"
          disabled={isSubmitting || !userAnswer.trim()}
        >
          {isSubmitting ? '제출 중...' : '제출하기'}
        </button>
      </form>

      <div className="problem-meta">
        <span className="problem-type">{problem.question_type}</span>
        <span className="problem-difficulty">
          난이도: {problem.difficulty}/5
        </span>
      </div>
    </div>
  );
};

export default ProblemDisplay;
