import React, { useState, useEffect } from 'react';
import { PlaceStairProblem, PlaceValues } from '../types';
import PlaceStair from './PlaceStair';
import './ProblemDisplay.css';

interface ProblemDisplayProps {
  problem: PlaceStairProblem;
  onSubmit: (answer: PlaceValues) => void;
  showHint: boolean;
  onHintRequest: () => void;
}

const ProblemDisplay: React.FC<ProblemDisplayProps> = ({
  problem,
  onSubmit,
  showHint,
  onHintRequest
}) => {
  const [answer, setAnswer] = useState<PlaceValues>({});
  const [currentHintIndex, setCurrentHintIndex] = useState(0);

  useEffect(() => {
    setAnswer({});
    setCurrentHintIndex(0);
  }, [problem.id]);

  const handleInputChange = (place: keyof PlaceValues, value: string) => {
    const numValue = parseInt(value) || 0;
    setAnswer(prev => ({
      ...prev,
      [place]: numValue
    }));
  };

  const handleSubmit = () => {
    onSubmit(answer);
  };

  const getPlaceInputs = () => {
    const places: Array<{ key: keyof PlaceValues; label: string; multiplier: number }> = [];

    if (problem.maxDigits >= 4) places.push({ key: 'thousands', label: '천의 자리', multiplier: 1000 });
    if (problem.maxDigits >= 3) places.push({ key: 'hundreds', label: '백의 자리', multiplier: 100 });
    if (problem.maxDigits >= 2) places.push({ key: 'tens', label: '십의 자리', multiplier: 10 });
    places.push({ key: 'ones', label: '일의 자리', multiplier: 1 });

    return places;
  };

  const renderAnswerInput = () => {
    switch (problem.type) {
      case 'identification':
      case 'decomposition':
        return (
          <div className="answer-section">
            <h3>각 자리의 값을 입력하세요:</h3>
            <div className="place-inputs">
              {getPlaceInputs().map(place => (
                <div key={place.key} className="place-input-group">
                  <label>{place.label}</label>
                  <input
                    type="number"
                    min="0"
                    max={place.multiplier * 9}
                    step={place.multiplier}
                    value={answer[place.key] || ''}
                    onChange={(e) => handleInputChange(place.key, e.target.value)}
                    placeholder="0"
                    className="place-input"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 'composition':
        return (
          <div className="answer-section">
            <h3>답을 입력하세요:</h3>
            <input
              type="number"
              value={answer.result || ''}
              onChange={(e) => setAnswer({ result: parseInt(e.target.value) || 0 })}
              placeholder="숫자를 입력하세요"
              className="composition-input"
            />
          </div>
        );

      case 'comparison':
        return (
          <div className="answer-section">
            <h3>더 큰 수를 선택하세요:</h3>
            <div className="comparison-buttons">
              <button
                onClick={() => setAnswer({ selected: problem.number })}
                className={`comparison-btn ${answer.selected === problem.number ? 'selected' : ''}`}
              >
                {problem.number}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="problem-display fade-in">
      {/* Header */}
      <div className="problem-header">
        <div className="problem-badge">
          문제 #{problem.id}
        </div>
        <div className="difficulty-badge">
          난이도: {'⭐'.repeat(problem.difficulty)}
        </div>
      </div>

      {/* Question */}
      <div className="question-section">
        <h2 className="question-text">{problem.question}</h2>
      </div>

      {/* Visualization */}
      <PlaceStair number={problem.number} interactive={false} />

      {/* Answer Input */}
      {renderAnswerInput()}

      {/* Hint Section */}
      {problem.hints && problem.hints.length > 0 && (
        <div className="hint-section">
          {!showHint ? (
            <button onClick={onHintRequest} className="hint-button">
              💡 힌트 보기
            </button>
          ) : (
            <div className="hint-box fade-in">
              <div className="hint-icon">💡</div>
              <p className="hint-text">{problem.hints[currentHintIndex]}</p>
              {currentHintIndex < problem.hints.length - 1 && (
                <button
                  onClick={() => setCurrentHintIndex(prev => prev + 1)}
                  className="next-hint-btn"
                >
                  다음 힌트 →
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        className="submit-button glow"
        disabled={Object.keys(answer).length === 0}
      >
        정답 확인
      </button>
    </div>
  );
};

export default ProblemDisplay;
