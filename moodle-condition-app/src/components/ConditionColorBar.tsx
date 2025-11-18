import React from 'react';
import type { DifficultyLevel, QuestionStatus, QuestionType } from '../types/moodle';
import { DEFAULT_COLOR_CONFIG } from '../types/moodle';
import './ConditionColorBar.css';

export interface ConditionColorBarProps {
  difficulty: DifficultyLevel;
  status: QuestionStatus;
  type: QuestionType;
  showLabels?: boolean;
  vertical?: boolean;
  size?: 'small' | 'medium' | 'large';
}

/**
 * ConditionColorBar Component
 * 문제 조건(난이도, 상태, 유형)을 색상 바로 시각화
 */
export const ConditionColorBar: React.FC<ConditionColorBarProps> = ({
  difficulty,
  status,
  type,
  showLabels = true,
  vertical = false,
  size = 'medium',
}) => {
  const difficultyColor = DEFAULT_COLOR_CONFIG.difficulty[difficulty];
  const statusColor = DEFAULT_COLOR_CONFIG.status[status];
  const typeColor = DEFAULT_COLOR_CONFIG.type[type];

  const difficultyLabel = {
    easy: '쉬움',
    medium: '보통',
    hard: '어려움',
  }[difficulty];

  const statusLabel = {
    not_started: '미완료',
    in_progress: '진행중',
    completed: '완료',
  }[status];

  const typeLabel = {
    multichoice: '객관식',
    shortanswer: '단답형',
    numerical: '계산',
    essay: '서술형',
    truefalse: '참/거짓',
  }[type];

  return (
    <div className={`condition-color-bar ${vertical ? 'vertical' : 'horizontal'} size-${size}`}>
      {/* Difficulty Bar */}
      <div className="condition-segment">
        <div
          className="color-bar difficulty-bar"
          style={{ backgroundColor: difficultyColor }}
          title={`난이도: ${difficultyLabel}`}
        >
          {showLabels && <span className="bar-label">{difficultyLabel}</span>}
        </div>
      </div>

      {/* Status Bar */}
      <div className="condition-segment">
        <div
          className="color-bar status-bar"
          style={{ backgroundColor: statusColor }}
          title={`상태: ${statusLabel}`}
        >
          {showLabels && <span className="bar-label">{statusLabel}</span>}
        </div>
      </div>

      {/* Type Bar */}
      <div className="condition-segment">
        <div
          className="color-bar type-bar"
          style={{ backgroundColor: typeColor }}
          title={`유형: ${typeLabel}`}
        >
          {showLabels && <span className="bar-label">{typeLabel}</span>}
        </div>
      </div>
    </div>
  );
};
