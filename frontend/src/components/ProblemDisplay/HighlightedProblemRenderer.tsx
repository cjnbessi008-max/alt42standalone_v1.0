/**
 * HighlightedProblemRenderer Component
 *
 * Renders mathematical problems with automatically highlighted key conditions.
 * Supports mobile-responsive design and accessibility features.
 */

import React, { useState } from 'react';
import './styles.css';

// ============================================================================
// Type Definitions
// ============================================================================

export interface KeyCondition {
  id: number;
  text: string;
  start_pos: number;
  end_pos: number;
  type: ConditionType;
  category: string;
  importance: ImportanceLevel;
  explanation: string;
}

export type ConditionType =
  | 'independence'
  | 'constraint'
  | 'assumption'
  | 'requirement'
  | 'exception'
  | 'sample_space'
  | 'event'
  | 'probability';

export type ImportanceLevel = 'critical' | 'high' | 'medium' | 'low';

export interface ProblemData {
  problem_id: string;
  problem_text: string;
  total_conditions: number;
  conditions: KeyCondition[];
}

export interface HighlightedProblemRendererProps {
  problemData: ProblemData;
  enableTooltips?: boolean;
  highlightMode?: 'always' | 'hover' | 'click';
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get CSS class name for condition type
 */
const getConditionClassName = (type: ConditionType, importance: ImportanceLevel): string => {
  return `highlight highlight-${type} importance-${importance}`;
};

/**
 * Get icon for condition type
 */
const getConditionIcon = (type: ConditionType): string => {
  const icons: Record<ConditionType, string> = {
    independence: '🔗',
    constraint: '⚠️',
    assumption: 'ℹ️',
    requirement: '✓',
    exception: '⛔',
    sample_space: '📊',
    event: '🎯',
    probability: '%',
  };
  return icons[type] || '•';
};

/**
 * Get Korean label for condition type
 */
const getConditionTypeLabel = (type: ConditionType): string => {
  const labels: Record<ConditionType, string> = {
    independence: '독립성',
    constraint: '제약조건',
    assumption: '가정',
    requirement: '요구사항',
    exception: '예외',
    sample_space: '표본공간',
    event: '사건',
    probability: '확률',
  };
  return labels[type] || type;
};

// ============================================================================
// Tooltip Component
// ============================================================================

interface TooltipProps {
  condition: KeyCondition;
  onClose: () => void;
}

const Tooltip: React.FC<TooltipProps> = ({ condition, onClose }) => {
  return (
    <div className="tooltip" role="tooltip">
      <div className="tooltip-header">
        <span className="tooltip-icon">{getConditionIcon(condition.type)}</span>
        <span className="tooltip-type">{getConditionTypeLabel(condition.type)}</span>
        <button
          className="tooltip-close"
          onClick={onClose}
          aria-label="Close tooltip"
        >
          ×
        </button>
      </div>
      <div className="tooltip-content">
        <p className="tooltip-text">{condition.text}</p>
        <p className="tooltip-explanation">{condition.explanation}</p>
        <div className="tooltip-meta">
          <span className={`importance-badge importance-${condition.importance}`}>
            중요도: {condition.importance}
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const HighlightedProblemRenderer: React.FC<HighlightedProblemRendererProps> = ({
  problemData,
  enableTooltips = true,
  highlightMode = 'click',
}) => {
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);
  const [hoveredCondition, setHoveredCondition] = useState<number | null>(null);

  /**
   * Render problem text with highlights
   */
  const renderHighlightedText = (): React.ReactNode[] => {
    const { problem_text, conditions } = problemData;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    // Sort conditions by start position
    const sortedConditions = [...conditions].sort((a, b) => a.start_pos - b.start_pos);

    sortedConditions.forEach((condition, idx) => {
      // Add text before highlight
      if (condition.start_pos > lastIndex) {
        elements.push(
          <span key={`text-${idx}`}>
            {problem_text.substring(lastIndex, condition.start_pos)}
          </span>
        );
      }

      // Add highlighted text
      const isActive = activeTooltip === condition.id;
      const isHovered = hoveredCondition === condition.id;

      elements.push(
        <mark
          key={`highlight-${idx}`}
          className={`${getConditionClassName(condition.type, condition.importance)} ${
            isActive ? 'active' : ''
          } ${isHovered ? 'hovered' : ''}`}
          onClick={() => handleHighlightClick(condition.id)}
          onMouseEnter={() => highlightMode === 'hover' && setHoveredCondition(condition.id)}
          onMouseLeave={() => highlightMode === 'hover' && setHoveredCondition(null)}
          role="button"
          tabIndex={0}
          aria-label={`${getConditionTypeLabel(condition.type)}: ${condition.text}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleHighlightClick(condition.id);
            }
          }}
        >
          {problem_text.substring(condition.start_pos, condition.end_pos)}
          {enableTooltips && isActive && (
            <Tooltip
              condition={condition}
              onClose={() => setActiveTooltip(null)}
            />
          )}
        </mark>
      );

      lastIndex = condition.end_pos;
    });

    // Add remaining text
    if (lastIndex < problem_text.length) {
      elements.push(
        <span key="text-end">{problem_text.substring(lastIndex)}</span>
      );
    }

    return elements;
  };

  /**
   * Handle highlight click
   */
  const handleHighlightClick = (conditionId: number) => {
    if (enableTooltips) {
      setActiveTooltip(activeTooltip === conditionId ? null : conditionId);
    }
  };

  /**
   * Render condition legend
   */
  const renderLegend = (): React.ReactNode => {
    // Get unique condition types
    const uniqueTypes = Array.from(
      new Set(problemData.conditions.map((c) => c.type))
    );

    return (
      <div className="condition-legend">
        <h4>핵심 조건 범례</h4>
        <div className="legend-items">
          {uniqueTypes.map((type) => (
            <div key={type} className="legend-item">
              <span className={`legend-color highlight-${type}`}></span>
              <span className="legend-icon">{getConditionIcon(type)}</span>
              <span className="legend-label">{getConditionTypeLabel(type)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="highlighted-problem-container">
      <div className="problem-header">
        <h3>문제</h3>
        {problemData.total_conditions > 0 && (
          <span className="condition-count">
            {problemData.total_conditions}개의 핵심 조건 발견
          </span>
        )}
      </div>

      <div className="problem-content" role="article">
        <p className="problem-text">{renderHighlightedText()}</p>
      </div>

      {problemData.total_conditions > 0 && renderLegend()}

      <div className="problem-footer">
        <button
          className="clear-highlights-btn"
          onClick={() => setActiveTooltip(null)}
        >
          툴팁 모두 닫기
        </button>
      </div>
    </div>
  );
};

export default HighlightedProblemRenderer;
