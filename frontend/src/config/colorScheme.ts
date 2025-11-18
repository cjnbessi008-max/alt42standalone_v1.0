import { ConditionType, ColorConfig } from '@/types';

/**
 * Color scheme for condition highlighting
 * Designed for educational accessibility and visual clarity
 */
export const colorScheme: Record<ConditionType, ColorConfig> = {
  [ConditionType.VALUE]: {
    primary: '#1976d2',      // Blue - Given values
    background: '#e3f2fd',
    border: '#1976d2',
    hover: '#bbdefb',
  },
  [ConditionType.CONSTRAINT]: {
    primary: '#2e7d32',      // Green - Constraints
    background: '#e8f5e9',
    border: '#2e7d32',
    hover: '#c8e6c9',
  },
  [ConditionType.RANGE]: {
    primary: '#f57c00',      // Orange/Yellow - Ranges
    background: '#fff3e0',
    border: '#f57c00',
    hover: '#ffe0b2',
  },
  [ConditionType.IMPORTANT]: {
    primary: '#d32f2f',      // Red - Important/Errors
    background: '#ffebee',
    border: '#d32f2f',
    hover: '#ffcdd2',
  },
  [ConditionType.CONDITIONAL]: {
    primary: '#7b1fa2',      // Purple - Conditional logic
    background: '#f3e5f5',
    border: '#7b1fa2',
    hover: '#e1bee7',
  },
};

/**
 * Get readable label for condition type
 */
export const conditionTypeLabels: Record<ConditionType, string> = {
  [ConditionType.VALUE]: '주어진 값',
  [ConditionType.CONSTRAINT]: '제약조건',
  [ConditionType.RANGE]: '범위조건',
  [ConditionType.IMPORTANT]: '중요조건',
  [ConditionType.CONDITIONAL]: '조건부로직',
};

/**
 * Get icon for condition type (using emoji for simplicity)
 */
export const conditionTypeIcons: Record<ConditionType, string> = {
  [ConditionType.VALUE]: '📊',
  [ConditionType.CONSTRAINT]: '✓',
  [ConditionType.RANGE]: '📏',
  [ConditionType.IMPORTANT]: '⚠️',
  [ConditionType.CONDITIONAL]: '🔀',
};
