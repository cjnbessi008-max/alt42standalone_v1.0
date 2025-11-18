/**
 * Vector Blend LMS - Problem Display Component
 * Shows problem information and instructions
 */

import React from 'react';
import type { Problem } from '../../types/problem';
import './ProblemDisplay.css';

interface ProblemDisplayProps {
  problem: Problem;
  showHint?: boolean;
  onToggleHint?: () => void;
}

const ProblemDisplay: React.FC<ProblemDisplayProps> = ({
  problem,
  showHint = false,
  onToggleHint,
}) => {
  const difficultyColors = {
    beginner: '#4caf50',
    intermediate: '#ff9800',
    advanced: '#f44336',
  };

  const difficultyLabels = {
    beginner: '초급',
    intermediate: '중급',
    advanced: '고급',
  };

  return (
    <div className="problem-display">
      {/* Header */}
      <div className="problem-header">
        <h2 className="problem-title">{problem.title}</h2>
        <span
          className="problem-difficulty"
          style={{ backgroundColor: difficultyColors[problem.difficulty] }}
        >
          {difficultyLabels[problem.difficulty]}
        </span>
      </div>

      {/* Description */}
      <div className="problem-description">
        <p>{problem.description}</p>
      </div>

      {/* Instructions */}
      <div className="problem-instructions">
        <h3>📝 Instructions</h3>
        <p>{problem.instructions}</p>
      </div>

      {/* Hint section */}
      {problem.hint && (
        <div className="problem-hint-section">
          <button
            className="hint-toggle-button"
            onClick={onToggleHint}
          >
            💡 {showHint ? 'Hide Hint' : 'Show Hint'}
          </button>
          {showHint && (
            <div className="problem-hint">
              {problem.hint}
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {problem.tags && problem.tags.length > 0 && (
        <div className="problem-tags">
          {problem.tags.map((tag) => (
            <span key={tag} className="problem-tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Estimated time */}
      {problem.estimatedTime && (
        <div className="problem-time">
          ⏱️ Estimated time: {Math.ceil(problem.estimatedTime / 60)} min
        </div>
      )}
    </div>
  );
};

export default ProblemDisplay;
