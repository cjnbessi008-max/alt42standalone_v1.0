import React, { useState } from 'react';
import './AnswerInputForm.css';

/**
 * Answer Input Form Component
 * Handles different types of answer inputs
 */
const AnswerInputForm = ({ problemType, onSubmit, onRequestHint, hintsUsed, loading }) => {
  const [answer, setAnswer] = useState('');
  const [selectedChoice, setSelectedChoice] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const submittedAnswer = problemType === 'multiple_choice' ? selectedChoice : answer;

    if (!submittedAnswer) {
      alert('답을 입력해주세요!');
      return;
    }

    onSubmit(submittedAnswer);
    setAnswer('');
    setSelectedChoice('');
  };

  const handleHintRequest = () => {
    if (hintsUsed >= 3) {
      alert('더 이상 힌트를 사용할 수 없습니다.');
      return;
    }
    onRequestHint(answer || selectedChoice);
  };

  const renderInput = () => {
    switch (problemType) {
      case 'numeric':
        return (
          <input
            type="number"
            className="answer-input numeric"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="답을 입력하세요 (숫자)"
            disabled={loading}
            autoFocus
          />
        );

      case 'text':
        return (
          <input
            type="text"
            className="answer-input text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="답을 입력하세요"
            disabled={loading}
            autoFocus
          />
        );

      case 'multiple_choice':
        return (
          <div className="multiple-choice-options">
            {['A', 'B', 'C', 'D'].map((choice) => (
              <label key={choice} className="choice-option">
                <input
                  type="radio"
                  name="choice"
                  value={choice}
                  checked={selectedChoice === choice}
                  onChange={(e) => setSelectedChoice(e.target.value)}
                  disabled={loading}
                />
                <span className="choice-label">{choice}</span>
              </label>
            ))}
          </div>
        );

      default:
        return (
          <textarea
            className="answer-input textarea"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="답을 입력하세요"
            rows={4}
            disabled={loading}
          />
        );
    }
  };

  const maxHints = 3;
  const remainingHints = maxHints - hintsUsed;

  return (
    <form className="answer-input-form" onSubmit={handleSubmit}>
      <h3>답안 작성</h3>

      {renderInput()}

      <div className="form-actions">
        <button
          type="button"
          className="hint-btn"
          onClick={handleHintRequest}
          disabled={loading || hintsUsed >= maxHints}
          title={`남은 힌트: ${remainingHints}개`}
        >
          💡 힌트 ({remainingHints})
        </button>

        <button
          type="button"
          className="clear-btn"
          onClick={() => {
            setAnswer('');
            setSelectedChoice('');
          }}
          disabled={loading}
        >
          지우기
        </button>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? '제출 중...' : '제출하기'}
        </button>
      </div>
    </form>
  );
};

export default AnswerInputForm;
