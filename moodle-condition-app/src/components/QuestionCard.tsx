import React from 'react';
import type { MoodleQuestion } from '../types/moodle';
import { ConditionColorBar } from './ConditionColorBar';
import './QuestionCard.css';

export interface QuestionCardProps {
  question: MoodleQuestion;
  onClick?: (question: MoodleQuestion) => void;
}

/**
 * QuestionCard Component
 * 개별 문제를 카드 형태로 표시하며 Condition Color Bar를 포함
 */
export const QuestionCard: React.FC<QuestionCardProps> = ({ question, onClick }) => {
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}초`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}분 ${remainingSeconds}초` : `${minutes}분`;
  };

  const getScoreColor = (current?: number, max?: number): string => {
    if (!current || !max) return '#9E9E9E';
    const percentage = (current / max) * 100;
    if (percentage >= 80) return '#4CAF50';
    if (percentage >= 60) return '#FF9800';
    return '#F44336';
  };

  return (
    <div className="question-card" onClick={() => onClick?.(question)}>
      <div className="question-card-header">
        <h3 className="question-title">{question.name}</h3>
        <span className="question-id">#{question.id}</span>
      </div>

      <div className="question-category">
        <span className="category-badge">{question.category}</span>
      </div>

      <div className="question-text">{question.questionText}</div>

      {/* Condition Color Bar */}
      <div className="question-color-bar-section">
        <ConditionColorBar
          difficulty={question.difficulty}
          status={question.status}
          type={question.type}
          showLabels={true}
          size="medium"
        />
      </div>

      {/* Question Stats */}
      <div className="question-stats">
        <div className="stat-item">
          <span className="stat-label">점수</span>
          <span
            className="stat-value"
            style={{ color: getScoreColor(question.currentScore, question.maxScore) }}
          >
            {question.currentScore ?? 0} / {question.maxScore}
          </span>
        </div>

        <div className="stat-item">
          <span className="stat-label">시도</span>
          <span className="stat-value">
            {question.attempts} / {question.maxAttempts}
          </span>
        </div>

        <div className="stat-item">
          <span className="stat-label">소요시간</span>
          <span className="stat-value">{formatTime(question.timeSpent)}</span>
        </div>
      </div>

      {/* Tags */}
      {question.tags && question.tags.length > 0 && (
        <div className="question-tags">
          {question.tags.map((tag, index) => (
            <span key={index} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
