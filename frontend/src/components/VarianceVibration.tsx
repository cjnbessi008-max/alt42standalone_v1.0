/**
 * Variance Vibration Component
 * Educational component for teaching statistical variance through haptic feedback
 * Displays in virtual smartphone screen (bottom-right corner)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  VarianceVibrationHandler,
  VarianceVibrationConfig,
  VarianceVibrationResult,
} from '../utils/VarianceVibrationHandler';
import { validateDataSet } from '../utils/VarianceCalculator';
import './VarianceVibration.css';

export interface VarianceProblem {
  id: string;
  questionText: string;
  dataSet: number[];
  isSample: boolean;
  expectedVariance?: number;
  hints?: string[];
  category?: string;
}

export interface VarianceVibrationProps {
  problem?: VarianceProblem;
  onAnswerSubmit?: (answer: number, isCorrect: boolean) => void;
  onVibrationTriggered?: (result: VarianceVibrationResult) => void;
  config?: Partial<VarianceVibrationConfig>;
  showStats?: boolean;
  autoVibrate?: boolean;
}

const VarianceVibration: React.FC<VarianceVibrationProps> = ({
  problem,
  onAnswerSubmit,
  onVibrationTriggered,
  config,
  showStats = true,
  autoVibrate = true,
}) => {
  const [handler] = useState(() => new VarianceVibrationHandler(config));
  const [result, setResult] = useState<VarianceVibrationResult | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [dataPoints, setDataPoints] = useState<number[]>([]);
  const [customMode, setCustomMode] = useState(false);
  const [newValue, setNewValue] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize with problem data or empty
  useEffect(() => {
    if (problem?.dataSet) {
      setDataPoints(problem.dataSet);
      setCustomMode(false);
    } else {
      // Default sample data
      setDataPoints([10, 12, 11, 13, 12, 10, 14, 11]);
      setCustomMode(true);
    }
  }, [problem]);

  // Calculate variance when data changes
  useEffect(() => {
    if (dataPoints.length > 0) {
      const validation = validateDataSet(dataPoints);
      if (validation.valid) {
        const newResult = handler.calculateVibration(
          dataPoints,
          problem?.isSample ?? false
        );
        setResult(newResult);

        // Auto-vibrate if enabled
        if (autoVibrate && newResult.shouldVibrate) {
          handler.triggerVibration(newResult.vibrationPattern);
          onVibrationTriggered?.(newResult);
        }

        // Draw visualization
        drawVarianceVisualization(newResult);
      }
    }
  }, [dataPoints, autoVibrate, handler, problem, onVibrationTriggered]);

  // Draw variance visualization on canvas
  const drawVarianceVisualization = useCallback((vResult: VarianceVibrationResult) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // Draw mean line
    const { mean, min, max } = vResult.stats;
    const range = max - min || 1;
    const meanY = height / 2;

    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, meanY);
    ctx.lineTo(width, meanY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw data points
    const pointSpacing = width / (dataPoints.length + 1);
    dataPoints.forEach((value, index) => {
      const x = pointSpacing * (index + 1);
      const normalizedValue = (value - mean) / (range / 2);
      const y = meanY - normalizedValue * (height / 3);

      // Point size based on distance from mean
      const distance = Math.abs(value - mean);
      const maxDistance = Math.max(...dataPoints.map(v => Math.abs(v - mean)));
      const pointSize = 4 + (distance / (maxDistance || 1)) * 6;

      // Color based on variance contribution
      const hue = 120 - (distance / (maxDistance || 1)) * 120; // Green to red
      ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;

      ctx.beginPath();
      ctx.arc(x, y, pointSize, 0, Math.PI * 2);
      ctx.fill();

      // Draw line to mean
      ctx.strokeStyle = `hsl(${hue}, 70%, 50%)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, meanY);
      ctx.stroke();
    });

    // Draw variance indicator
    const varianceHeight = vResult.normalizedVariance * (height / 4);
    ctx.fillStyle = `rgba(255, 87, 34, ${vResult.normalizedVariance})`;
    ctx.fillRect(width - 30, meanY - varianceHeight, 20, varianceHeight * 2);

  }, [dataPoints]);

  // Handle answer submission
  const handleSubmit = useCallback(() => {
    if (!result || !problem) return;

    const answer = parseFloat(userAnswer);
    if (isNaN(answer)) {
      alert('유효한 숫자를 입력하세요 (Please enter a valid number)');
      return;
    }

    const tolerance = 0.1; // 10% tolerance
    const expectedVariance = problem.expectedVariance ?? result.variance;
    const difference = Math.abs(answer - expectedVariance);
    const percentDiff = difference / expectedVariance;
    const correct = percentDiff <= tolerance;

    setIsCorrect(correct);
    setShowFeedback(true);

    // Trigger feedback vibration
    if (correct) {
      handler.triggerVibration([200]); // Success pulse
    } else {
      handler.triggerVibration([100, 50, 100, 50, 100]); // Error pattern
    }

    onAnswerSubmit?.(answer, correct);
  }, [userAnswer, result, problem, handler, onAnswerSubmit]);

  // Add custom data point
  const handleAddValue = useCallback(() => {
    const value = parseFloat(newValue);
    if (isNaN(value)) {
      alert('유효한 숫자를 입력하세요 (Please enter a valid number)');
      return;
    }

    setDataPoints(prev => [...prev, value]);
    setNewValue('');
  }, [newValue]);

  // Remove last data point
  const handleRemoveValue = useCallback(() => {
    setDataPoints(prev => prev.slice(0, -1));
  }, []);

  // Reset to default
  const handleReset = useCallback(() => {
    if (problem?.dataSet) {
      setDataPoints(problem.dataSet);
    } else {
      setDataPoints([10, 12, 11, 13, 12, 10, 14, 11]);
    }
    setUserAnswer('');
    setShowFeedback(false);
    setIsCorrect(null);
  }, [problem]);

  // Manual vibration trigger
  const handleManualVibrate = useCallback(() => {
    if (result) {
      handler.triggerVibration(result.vibrationPattern);
      onVibrationTriggered?.(result);
    }
  }, [result, handler, onVibrationTriggered]);

  if (!result) {
    return <div className="variance-vibration loading">Loading...</div>;
  }

  return (
    <div className="variance-vibration smartphone-frame">
      {/* Smartphone Screen Header */}
      <div className="smartphone-header">
        <div className="status-bar">
          <span className="time">{new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
          <div className="status-icons">
            <span className="signal">📶</span>
            <span className="battery">🔋</span>
          </div>
        </div>
        <div className="app-header">
          <h2>📊 분산 진동 학습 (Variance Vibration)</h2>
        </div>
      </div>

      {/* Main Content */}
      <div className="smartphone-content">
        {/* Problem Statement */}
        {problem && (
          <div className="problem-section">
            <h3>문제 (Problem)</h3>
            <p>{problem.questionText}</p>
            {problem.hints && problem.hints.length > 0 && (
              <details className="hints">
                <summary>💡 힌트 (Hints)</summary>
                <ul>
                  {problem.hints.map((hint, idx) => (
                    <li key={idx}>{hint}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        {/* Data Display */}
        <div className="data-section">
          <h3>데이터 (Data)</h3>
          <div className="data-points">
            {dataPoints.map((value, idx) => (
              <span key={idx} className="data-point">
                {value.toFixed(2)}
              </span>
            ))}
          </div>

          {/* Custom Mode Controls */}
          {customMode && (
            <div className="data-controls">
              <input
                type="number"
                step="0.01"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="새 값 입력"
                className="value-input"
              />
              <button onClick={handleAddValue} className="btn btn-add">
                ➕ 추가
              </button>
              <button onClick={handleRemoveValue} className="btn btn-remove" disabled={dataPoints.length === 0}>
                ➖ 제거
              </button>
              <button onClick={handleReset} className="btn btn-reset">
                🔄 초기화
              </button>
            </div>
          )}
        </div>

        {/* Visualization */}
        <div className="visualization-section">
          <canvas
            ref={canvasRef}
            width={300}
            height={200}
            className="variance-canvas"
          />
        </div>

        {/* Statistics Display */}
        {showStats && (
          <div className="stats-section">
            <h3>통계 (Statistics)</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">평균 (Mean):</span>
                <span className="stat-value">{result.stats.mean.toFixed(2)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">분산 (Variance):</span>
                <span className="stat-value highlight">{result.variance.toFixed(2)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">표준편차 (SD):</span>
                <span className="stat-value">{result.stats.standardDeviation.toFixed(2)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">범위 (Range):</span>
                <span className="stat-value">{result.stats.range.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Vibration Intensity Indicator */}
        <div className="vibration-section">
          <h3>진동 강도 (Vibration Intensity)</h3>
          <div className="intensity-display">
            <div className="intensity-bar-container">
              <div
                className="intensity-bar"
                style={{
                  width: `${(result.intensity / 10) * 100}%`,
                  backgroundColor: `hsl(${120 - (result.intensity / 10) * 120}, 70%, 50%)`,
                }}
              />
            </div>
            <div className="intensity-info">
              <span className="intensity-value">{result.intensity} / 10</span>
              <span className="intensity-label">
                {VarianceVibrationHandler.getIntensityDescription(result.intensity)}
              </span>
            </div>
          </div>
          <p className="variance-description">
            {VarianceVibrationHandler.getVarianceDescription(result.normalizedVariance)}
          </p>
          <button onClick={handleManualVibrate} className="btn btn-vibrate">
            📳 진동 테스트 (Test Vibration)
          </button>
        </div>

        {/* Answer Input (if problem provided) */}
        {problem && (
          <div className="answer-section">
            <h3>답변 입력 (Your Answer)</h3>
            <input
              type="number"
              step="0.01"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="분산 값을 입력하세요"
              className="answer-input"
            />
            <button onClick={handleSubmit} className="btn btn-submit">
              제출 (Submit)
            </button>

            {/* Feedback */}
            {showFeedback && (
              <div className={`feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
                {isCorrect ? (
                  <>
                    <span className="feedback-icon">✅</span>
                    <span className="feedback-text">정답입니다! (Correct!)</span>
                  </>
                ) : (
                  <>
                    <span className="feedback-icon">❌</span>
                    <span className="feedback-text">
                      다시 시도해보세요. 정답: {result.variance.toFixed(2)}
                      <br />
                      (Try again. Answer: {result.variance.toFixed(2)})
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Device Support Warning */}
        {!VarianceVibrationHandler.isVibrationSupported() && (
          <div className="warning-banner">
            ⚠️ 이 기기는 진동을 지원하지 않습니다.
            <br />
            (Vibration not supported on this device)
          </div>
        )}
      </div>
    </div>
  );
};

export default VarianceVibration;
