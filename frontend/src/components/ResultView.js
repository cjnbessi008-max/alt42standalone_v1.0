import React, { useEffect, useState } from 'react';
import CandleDisplay from './CandleDisplay';
import './ResultView.css';

function ResultView({ result, problem, onNext }) {
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    // Play sound effect (optional)
    if (result.is_correct) {
      // Success sound
    } else {
      // Error sound
    }
  }, [result]);

  if (!result || !problem) {
    return null;
  }

  const { base, result: resultValue } = problem;

  return (
    <div className="result-view">
      {/* Result header */}
      <div className={`result-header ${result.is_correct ? 'correct' : 'incorrect'}`}>
        <div className="result-icon">
          {result.is_correct ? '🎉' : '💪'}
        </div>
        <h2>
          {result.is_correct ? '정답입니다!' : '아쉬워요!'}
        </h2>
        <p className="result-message">
          {result.is_correct
            ? '훌륭해요! 로그를 잘 이해하고 있어요!'
            : '괜찮아요! 다시 도전해보세요!'}
        </p>
      </div>

      {/* Candle visualization */}
      <div className="result-candles">
        <h3>정답: {result.correct_answer}개의 촛불</h3>
        <CandleDisplay
          count={result.candle_count}
          animated={true}
          highlightIndex={null}
        />
      </div>

      {/* Feedback */}
      <div className="feedback-card">
        <div className="feedback-content">
          <p>{result.feedback}</p>
        </div>
      </div>

      {/* Step-by-step explanation */}
      {result.steps && result.steps.length > 0 && (
        <div className="steps-section">
          <button
            className="steps-toggle"
            onClick={() => setShowExplanation(!showExplanation)}
          >
            {showExplanation ? '▼' : '▶'} 단계별 설명 보기
          </button>

          {showExplanation && (
            <div className="steps-container">
              {result.steps.map((step, index) => (
                <div key={index} className="step-item">
                  <div className="step-number">
                    {step.step}단계
                  </div>
                  <div className="step-content">
                    <div className="step-calculation">
                      {step.calculation}
                    </div>
                    <div className="step-result">
                      = {step.result}
                    </div>
                  </div>
                  <div className="step-candles">
                    🕯️ × {step.candles}
                  </div>
                </div>
              ))}

              {result.explanation && (
                <div className="explanation-box">
                  <strong>설명:</strong>
                  <p>{result.explanation}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Attempt info */}
      <div className="attempt-info">
        <div className="info-item">
          <span className="info-label">시도 횟수:</span>
          <span className="info-value">
            {result.attempt_number} / {result.max_attempts}
          </span>
        </div>
      </div>

      {/* Next button */}
      <div className="action-section">
        <button
          className="btn btn-next"
          onClick={onNext}
        >
          {result.is_correct ? '다음 문제 →' : '다시 풀기'}
        </button>
      </div>
    </div>
  );
}

export default ResultView;
