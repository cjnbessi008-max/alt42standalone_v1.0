import React, { useState, useEffect } from 'react';
import CandleDisplay from './CandleDisplay';
import './ProblemView.css';

function ProblemView({ problem, onSubmit }) {
  const [answer, setAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [showCandles, setShowCandles] = useState(false);
  const [startTime] = useState(Date.now());
  const [hintUsed, setHintUsed] = useState(false);

  useEffect(() => {
    // Reset state when problem changes
    setAnswer('');
    setShowHint(false);
    setShowCandles(false);
    setHintUsed(false);
  }, [problem]);

  if (!problem) {
    return (
      <div className="problem-view">
        <div className="no-problem">
          <p>문제를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!answer || answer.trim() === '') {
      alert('답을 입력해주세요!');
      return;
    }

    const numAnswer = parseInt(answer, 10);
    if (isNaN(numAnswer) || numAnswer < 0) {
      alert('올바른 숫자를 입력해주세요!');
      return;
    }

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    onSubmit(numAnswer, timeSpent, hintUsed);
  };

  const handleHint = () => {
    setShowHint(true);
    setHintUsed(true);
  };

  const handleShowCandles = () => {
    setShowCandles(!showCandles);
  };

  // Parse base and result from question text
  const parseQuestion = () => {
    const text = problem.question_text || '';
    const match = text.match(/log[_₍]?(\d+)[₎]?\s+(\d+)/);

    if (match) {
      return {
        base: match[1],
        result: match[2],
      };
    }

    return {
      base: problem.base || '?',
      result: problem.result || '?',
    };
  };

  const { base, result } = parseQuestion();

  return (
    <div className="problem-view">
      {/* Problem header */}
      <div className="problem-header">
        <div className="difficulty-badge" data-difficulty={problem.difficulty}>
          난이도 {problem.difficulty}
        </div>
        <h2>로그 계산하기</h2>
      </div>

      {/* Question */}
      <div className="question-card">
        <div className="question-text">
          <span className="question-label">문제</span>
          <div className="question-formula">
            <span className="log-text">log</span>
            <sub className="base">{base}</sub>
            <span className="result">{result}</span>
            <span className="equals">=</span>
            <span className="unknown">?</span>
          </div>
        </div>

        <div className="question-hint-text">
          "{base}를 몇 번 곱해야 {result}이(가) 되나요?"
        </div>
      </div>

      {/* Candle visualization (optional) */}
      {showCandles && (
        <div className="visualization-section">
          <CandleDisplay count={0} animated={false} />
          <p className="visualization-note">
            정답을 입력하면 촛불이 나타납니다!
          </p>
        </div>
      )}

      {/* Answer input */}
      <form onSubmit={handleSubmit} className="answer-form">
        <div className="input-group">
          <label htmlFor="answer">답:</label>
          <input
            id="answer"
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="숫자를 입력하세요"
            min="0"
            max="20"
            autoFocus
          />
          <span className="input-suffix">개</span>
        </div>

        <div className="button-group">
          <button type="submit" className="btn btn-primary">
            제출하기
          </button>
        </div>
      </form>

      {/* Hint section */}
      <div className="hint-section">
        {!showHint ? (
          <button
            type="button"
            onClick={handleHint}
            className="btn btn-secondary"
          >
            💡 힌트 보기
          </button>
        ) : (
          <div className="hint-box">
            <div className="hint-icon">💡</div>
            <div className="hint-content">
              <strong>힌트:</strong>
              <p>{problem.hint_text}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProblemView;
