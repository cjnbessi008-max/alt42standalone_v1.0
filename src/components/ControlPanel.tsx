import React from 'react';
import { RecurrenceProblem } from '../types/recurrence';
import { recurrenceProblems } from '../utils/recurrenceProblems';
import './ControlPanel.css';

interface ControlPanelProps {
  selectedProblem: RecurrenceProblem;
  onProblemChange: (problem: RecurrenceProblem) => void;
  inputValue: number;
  onInputChange: (value: number) => void;
  isAnimating: boolean;
  onToggleAnimation: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  selectedProblem,
  onProblemChange,
  inputValue,
  onInputChange,
  isAnimating,
  onToggleAnimation,
  speed,
  onSpeedChange
}) => {
  return (
    <div className="control-panel">
      <div className="panel-header">
        <h1 className="panel-title">🌊 Recurrence Wave</h1>
        <p className="panel-subtitle">점화식을 파도로 시각화</p>
      </div>

      <div className="control-section">
        <label className="control-label">문제 선택</label>
        <div className="problem-selector">
          {recurrenceProblems.map(problem => (
            <button
              key={problem.id}
              className={`problem-button ${selectedProblem.id === problem.id ? 'active' : ''}`}
              onClick={() => onProblemChange(problem)}
            >
              {problem.name}
            </button>
          ))}
        </div>
      </div>

      <div className="problem-info">
        <h3 className="info-title">{selectedProblem.name}</h3>
        <p className="info-description">{selectedProblem.description}</p>
        <div className="formula-box">
          <div className="formula">{selectedProblem.formula}</div>
          <div className="base-case">{selectedProblem.baseCase}</div>
        </div>
        <div className="example">예시: {selectedProblem.example}</div>
      </div>

      <div className="control-section">
        <label className="control-label">
          입력 값: <span className="value-display">{inputValue}</span>
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={inputValue}
          onChange={(e) => onInputChange(Number(e.target.value))}
          className="slider"
        />
      </div>

      <div className="control-section">
        <label className="control-label">
          애니메이션 속도: <span className="value-display">{speed.toFixed(2)}x</span>
        </label>
        <input
          type="range"
          min="0.5"
          max="3"
          step="0.1"
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className="slider"
        />
      </div>

      <div className="control-section">
        <button
          className={`animation-button ${isAnimating ? 'playing' : 'paused'}`}
          onClick={onToggleAnimation}
        >
          {isAnimating ? '⏸ 일시정지' : '▶ 재생'}
        </button>
      </div>

      <div className="info-footer">
        <p>💡 각 파도 층은 재귀 호출의 깊이를 나타냅니다.</p>
        <p>🔢 원 안의 숫자는 현재 계산 중인 값입니다.</p>
      </div>
    </div>
  );
};
