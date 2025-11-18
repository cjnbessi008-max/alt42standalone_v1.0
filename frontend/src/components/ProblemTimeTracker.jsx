import React from 'react';
import { useProblemTimeTracking } from '../hooks/useProblemTimeTracking';
import './ProblemTimeTracker.css';

/**
 * ProblemTimeTracker Component
 * 문제 풀이 시간을 표시하고 추적하는 컴포넌트
 *
 * @param {object} props
 * @param {string} props.studentId - Student ID from LMS
 * @param {string} props.problemId - Problem ID from LMS
 * @param {boolean} props.showTimer - Whether to display the timer
 * @param {function} props.onComplete - Callback when problem is completed
 * @param {boolean} props.autoStart - Auto-start tracking
 * @param {React.ReactNode} props.children - Problem content
 */
export function ProblemTimeTracker({
  studentId,
  problemId,
  showTimer = true,
  onComplete = null,
  autoStart = true,
  children,
}) {
  const {
    isTracking,
    formattedTime,
    error,
    warningLevel,
    recommendedTime,
    recordInteraction,
    recordHintRequest,
    completeAttempt,
  } = useProblemTimeTracking(studentId, problemId, autoStart);

  const handleSubmit = async (isCorrect, answerData) => {
    try {
      const result = await completeAttempt(isCorrect, answerData);

      if (onComplete) {
        onComplete(result);
      }
    } catch (err) {
      console.error('Failed to complete attempt:', err);
    }
  };

  // Wrap children with interaction tracking
  const handleClick = (e) => {
    recordInteraction({
      element: e.target.tagName,
      timestamp: new Date().toISOString(),
    });
  };

  const handleHintClick = () => {
    recordHintRequest({
      timestamp: new Date().toISOString(),
    });
  };

  // Format recommended time
  const formatRecommendedTime = (seconds) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Get warning message
  const getWarningMessage = () => {
    if (!warningLevel) return null;

    if (warningLevel === 'approaching') {
      return `⚠️ 권장 시간(${formatRecommendedTime(recommendedTime)})에 근접하고 있습니다. 다른 문제로 넘어가는 것을 고려해보세요.`;
    } else if (warningLevel === 'exceeded') {
      return `🚨 권장 시간(${formatRecommendedTime(recommendedTime)})을 초과했습니다. 힌트를 확인하거나 다음에 다시 시도해보세요.`;
    }
    return null;
  };

  return (
    <div className="problem-time-tracker" onClick={handleClick}>
      {showTimer && (
        <div className={`timer-display ${warningLevel ? `warning-${warningLevel}` : ''}`}>
          <div className="timer-label">소요 시간</div>
          <div className="timer-value">
            {isTracking ? formattedTime : '--:--:--'}
          </div>
          {isTracking && <div className="tracking-indicator">⏱️ 추적 중</div>}
          {recommendedTime && (
            <div className="recommended-time">
              권장 시간: {formatRecommendedTime(recommendedTime)}
            </div>
          )}
        </div>
      )}

      {warningLevel && (
        <div className={`warning-message warning-${warningLevel}`}>
          {getWarningMessage()}
        </div>
      )}

      {error && (
        <div className="error-message">
          오류: {error}
        </div>
      )}

      <div className="problem-content">
        {typeof children === 'function'
          ? children({ handleSubmit, handleHintClick, recordInteraction })
          : children}
      </div>
    </div>
  );
}
