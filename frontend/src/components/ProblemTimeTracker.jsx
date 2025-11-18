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

  return (
    <div className="problem-time-tracker" onClick={handleClick}>
      {showTimer && (
        <div className="timer-display">
          <div className="timer-label">소요 시간</div>
          <div className="timer-value">
            {isTracking ? formattedTime : '--:--:--'}
          </div>
          {isTracking && <div className="tracking-indicator">⏱️ 추적 중</div>}
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
