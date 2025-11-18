import React from 'react';
import type { RecurrenceProblem } from '../types';
import './ControlPanel.css';

interface ControlPanelProps {
  problems: RecurrenceProblem[];
  selectedProblem: RecurrenceProblem | null;
  onSelectProblem: (problem: RecurrenceProblem) => void;
  currentStep: number;
  maxSteps: number;
  isAnimating: boolean;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onSpeedChange: (speed: number) => void;
}

/**
 * Control Panel Component
 * Provides UI controls for problem selection and animation
 */
const ControlPanel: React.FC<ControlPanelProps> = ({
  problems,
  selectedProblem,
  onSelectProblem,
  currentStep,
  maxSteps,
  isAnimating,
  speed,
  onPlay,
  onPause,
  onReset,
  onStepForward,
  onStepBackward,
  onSpeedChange,
}) => {
  return (
    <div className="control-panel">
      {/* Header */}
      <div className="control-header">
        <h2>🌟 Recurrence Beam</h2>
        <p className="subtitle">점화식 시각화</p>
      </div>

      {/* Problem Selector */}
      <div className="problem-selector">
        <label>문제 선택:</label>
        <select
          value={selectedProblem?.id || ''}
          onChange={(e) => {
            const problem = problems.find((p) => p.id === e.target.value);
            if (problem) onSelectProblem(problem);
          }}
        >
          <option value="">문제를 선택하세요</option>
          {problems.map((problem) => (
            <option key={problem.id} value={problem.id}>
              {problem.title}
            </option>
          ))}
        </select>
      </div>

      {/* Problem Info */}
      {selectedProblem && (
        <div className="problem-info">
          <h3>{selectedProblem.title}</h3>
          <p className="description">{selectedProblem.description}</p>
          <div className="formula-box">
            <strong>점화식:</strong> <code>{selectedProblem.formula}</code>
          </div>
          <div className="initial-conditions">
            <strong>초기값:</strong>
            {Object.entries(selectedProblem.initialConditions).map(([key, value]) => (
              <span key={key} className="condition">
                {key} = {value}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Playback Controls */}
      {selectedProblem && (
        <div className="playback-controls">
          <div className="button-group">
            <button
              className="control-btn"
              onClick={onReset}
              title="처음으로"
            >
              ⏮️
            </button>
            <button
              className="control-btn"
              onClick={onStepBackward}
              disabled={currentStep === 0}
              title="이전 단계"
            >
              ⏪
            </button>
            {isAnimating ? (
              <button
                className="control-btn primary"
                onClick={onPause}
                title="일시정지"
              >
                ⏸️
              </button>
            ) : (
              <button
                className="control-btn primary"
                onClick={onPlay}
                disabled={currentStep >= maxSteps - 1}
                title="재생"
              >
                ▶️
              </button>
            )}
            <button
              className="control-btn"
              onClick={onStepForward}
              disabled={currentStep >= maxSteps - 1}
              title="다음 단계"
            >
              ⏩
            </button>
          </div>

          {/* Progress Bar */}
          <div className="progress-container">
            <div className="progress-label">
              단계: {currentStep + 1} / {maxSteps}
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${((currentStep + 1) / maxSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Speed Control */}
          <div className="speed-control">
            <label>속도:</label>
            <input
              type="range"
              min="1"
              max="10"
              value={speed}
              onChange={(e) => onSpeedChange(Number(e.target.value))}
            />
            <span className="speed-value">{speed}x</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
