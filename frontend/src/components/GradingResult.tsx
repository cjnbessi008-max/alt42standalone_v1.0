/**
 * Grading Result Component with Visual Effects
 * Displays grading results with success pulse or error crack animations
 */

import React, { useEffect, useState } from 'react';
import { GradingResult as GradingResultType, GradingDisplayConfig } from '../types/grading';
import '../styles/GradingEffects.css';

interface GradingResultProps {
  result: GradingResultType;
  config?: Partial<GradingDisplayConfig>;
  onAnimationComplete?: () => void;
}

const defaultConfig: GradingDisplayConfig = {
  showAnimation: true,
  animationDuration: 800,
  soundEnabled: false,
  accessibilityMode: false,
};

export const GradingResultComponent: React.FC<GradingResultProps> = ({
  result,
  config = {},
  onAnimationComplete,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);

  const mergedConfig = { ...defaultConfig, ...config };
  const resultType = result.isCorrect ? 'success' : 'error';

  useEffect(() => {
    // Start animation
    if (mergedConfig.showAnimation) {
      setIsAnimating(true);

      // Animate score counter
      animateScore(0, result.score, mergedConfig.animationDuration);

      // End animation
      const timer = setTimeout(() => {
        setIsAnimating(false);
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }, mergedConfig.animationDuration);

      return () => clearTimeout(timer);
    } else {
      setDisplayScore(result.score);
    }
  }, [result, mergedConfig]);

  const animateScore = (start: number, end: number, duration: number) => {
    const startTime = Date.now();
    const updateScore = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const current = Math.floor(start + (end - start) * progress);
      setDisplayScore(current);

      if (progress < 1) {
        requestAnimationFrame(updateScore);
      }
    };
    requestAnimationFrame(updateScore);
  };

  const getResultIcon = () => {
    return result.isCorrect ? '✓' : '✗';
  };

  const getResultMessage = () => {
    if (result.isCorrect) {
      const percentage = (result.score / result.maxScore) * 100;
      if (percentage === 100) return '완벽합니다!';
      if (percentage >= 80) return '잘했습니다!';
      return '정답입니다!';
    } else {
      return '다시 시도해보세요';
    }
  };

  return (
    <div
      className={`grading-result ${resultType} ${isAnimating ? 'animate' : ''}`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Crack overlay for error effect */}
      {resultType === 'error' && (
        <div className="crack-overlay" aria-hidden="true">
          <div className="crack-line crack-1"></div>
          <div className="crack-line crack-2"></div>
          <div className="crack-line crack-3"></div>
        </div>
      )}

      {/* Result Icon */}
      <div
        className="result-icon"
        role="img"
        aria-label={result.isCorrect ? '정답' : '오답'}
      >
        {getResultIcon()}
      </div>

      {/* Result Message */}
      <h2 className="result-title">
        {getResultMessage()}
      </h2>

      {/* Score Display */}
      <div className="score-display">
        <span className="score-current" aria-label="획득 점수">
          {displayScore}
        </span>
        <span className="score-separator"> / </span>
        <span className="score-max" aria-label="만점">
          {result.maxScore}
        </span>
      </div>

      {/* Feedback */}
      {result.feedback && (
        <div className="feedback-message">
          <strong>피드백:</strong> {result.feedback}
        </div>
      )}

      {/* Time Spent */}
      {result.timeSpent !== undefined && (
        <div className="time-spent">
          <small>소요 시간: {Math.round(result.timeSpent)}초</small>
        </div>
      )}
    </div>
  );
};

export default GradingResultComponent;
