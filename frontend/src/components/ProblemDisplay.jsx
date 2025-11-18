import React from 'react';
import './ProblemDisplay.css';

/**
 * Problem Display Component
 * Renders the current problem for the student
 */
const ProblemDisplay = ({ problem, attemptNumber }) => {
  if (!problem) {
    return (
      <div className="problem-display">
        <p className="no-problem">문제를 불러오는 중...</p>
      </div>
    );
  }

  const { statement, type, difficulty_level, estimated_time, visuals } = problem;

  const difficultyStars = '⭐'.repeat(difficulty_level);

  return (
    <div className="problem-display">
      {/* Problem Header */}
      <div className="problem-header">
        <div className="problem-meta">
          <span className="difficulty" title={`난이도: ${difficulty_level}/5`}>
            {difficultyStars}
          </span>
          <span className="estimated-time">
            ⏱️ 예상 시간: {estimated_time || 60}초
          </span>
          {attemptNumber && (
            <span className="attempt-number">시도 #{attemptNumber}</span>
          )}
        </div>
      </div>

      {/* Problem Statement */}
      <div className="problem-statement">
        <h2>문제</h2>
        <div className="statement-content">
          {statement}
        </div>
      </div>

      {/* Visual Elements (if any) */}
      {visuals && (
        <div className="problem-visuals">
          {visuals.type === 'image' && (
            <img
              src={visuals.url}
              alt="문제 이미지"
              className="problem-image"
            />
          )}
          {visuals.type === 'svg' && (
            <div
              className="problem-svg"
              dangerouslySetInnerHTML={{ __html: visuals.content }}
            />
          )}
        </div>
      )}

      {/* Problem Type Badge */}
      <div className="problem-footer">
        <span className="problem-type-badge">{getProblemTypeLabel(type)}</span>
      </div>
    </div>
  );
};

const getProblemTypeLabel = (type) => {
  const labels = {
    numeric: '숫자 입력',
    multiple_choice: '객관식',
    text: '텍스트 입력',
    drag_and_drop: '드래그 앤 드롭',
    drawing: '그리기',
  };
  return labels[type] || '문제';
};

export default ProblemDisplay;
