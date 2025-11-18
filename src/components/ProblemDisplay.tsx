/**
 * Problem Display Component
 * Shows problem details and handles student interactions
 */

import React, { useState } from 'react';
import { Problem, Submission, Vector } from '../types';
import { formatAngle, anglesEqual, vectorsEqual } from '../utils/vectorMath';

interface ProblemDisplayProps {
  problem: Problem;
  onSubmit: (submission: Submission) => void;
  currentAnswer?: Vector;
  attemptNumber: number;
  maxAttempts: number;
}

const ProblemDisplay: React.FC<ProblemDisplayProps> = ({
  problem,
  onSubmit,
  currentAnswer,
  attemptNumber,
  maxAttempts,
}) => {
  const [showHint, setShowHint] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [feedback, setFeedback] = useState<string>('');

  const handleSubmit = () => {
    if (!currentAnswer) {
      setFeedback('나침반을 조작하여 답을 선택해주세요.');
      return;
    }

    const submission: Submission = {
      problemId: problem.id,
      studentId: 'current', // Will be filled by service
      answer: currentAnswer,
      timestamp: new Date(),
      isCorrect: false,
      attemptNumber,
    };

    // Check if answer is correct (client-side validation)
    let isCorrect = false;
    if (problem.targetAngle !== undefined) {
      isCorrect = anglesEqual(currentAnswer.angle, problem.targetAngle, 0.1);
    } else if (problem.targetVector) {
      isCorrect = vectorsEqual(currentAnswer, problem.targetVector, 0.05);
    }

    submission.isCorrect = isCorrect;

    if (isCorrect) {
      setFeedback('🎉 정답입니다!');
    } else {
      setFeedback(`아쉽네요. 다시 시도해보세요. (${attemptNumber}/${maxAttempts})`);
    }

    onSubmit(submission);
  };

  const handleShowHint = () => {
    setShowHint(true);
  };

  const handleNextHint = () => {
    if (problem.hints && hintIndex < problem.hints.length - 1) {
      setHintIndex(hintIndex + 1);
    }
  };

  const getDifficultyColor = () => {
    switch (problem.difficulty) {
      case 'easy':
        return '#4CAF50';
      case 'medium':
        return '#FF9800';
      case 'hard':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const getDifficultyLabel = () => {
    switch (problem.difficulty) {
      case 'easy':
        return '쉬움';
      case 'medium':
        return '보통';
      case 'hard':
        return '어려움';
      default:
        return '';
    }
  };

  return (
    <div className="problem-display">
      <div className="problem-header">
        <h2>{problem.title}</h2>
        <span
          className="difficulty-badge"
          style={{
            backgroundColor: getDifficultyColor(),
            color: 'white',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
        >
          {getDifficultyLabel()}
        </span>
      </div>

      <div className="problem-description">
        <p>{problem.description}</p>
      </div>

      {problem.targetAngle !== undefined && (
        <div className="problem-target">
          <p>
            <strong>목표 각도:</strong> {formatAngle(problem.targetAngle)}
          </p>
        </div>
      )}

      {problem.targetVector && (
        <div className="problem-target">
          <p>
            <strong>목표 벡터:</strong> ({problem.targetVector.x.toFixed(2)}, {problem.targetVector.y.toFixed(2)})
          </p>
        </div>
      )}

      <div className="problem-actions">
        <button onClick={handleSubmit} className="submit-button" disabled={attemptNumber > maxAttempts}>
          제출하기
        </button>

        {problem.hints && problem.hints.length > 0 && (
          <button onClick={showHint ? handleNextHint : handleShowHint} className="hint-button">
            {showHint ? '다음 힌트' : '힌트 보기'}
          </button>
        )}
      </div>

      {showHint && problem.hints && problem.hints[hintIndex] && (
        <div className="hint-box">
          <h4>💡 힌트 {hintIndex + 1}:</h4>
          <p>{problem.hints[hintIndex]}</p>
        </div>
      )}

      {feedback && (
        <div className={`feedback-box ${feedback.includes('정답') ? 'correct' : 'incorrect'}`}>
          <p>{feedback}</p>
        </div>
      )}

      <div className="attempts-counter">
        <p>
          시도 횟수: {attemptNumber} / {maxAttempts}
        </p>
      </div>
    </div>
  );
};

export default ProblemDisplay;
